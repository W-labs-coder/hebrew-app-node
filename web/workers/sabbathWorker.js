import shopify from '../shopify.js';
import User from '../models/User.js';

let running = false;

export function startSabbathWorker() {
  if (running) return;
  running = true;
  const intervalMs = parseInt(process.env.SABBATH_WORKER_INTERVAL_MS || '60000', 10);

  console.log(`[Sabbath Worker] Started, polling every ${intervalMs}ms`);

  setInterval(async () => {
    try {
      await processSabbathUsers();
    } catch (err) {
      console.error('[Sabbath Worker] Tick error:', err);
    }
  }, intervalMs);
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Parse "HH:MM" string into { hours, minutes }.
 */
function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return { hours: h, minutes: m };
}

/**
 * Convert a day name + time to a "minutes since Sunday 00:00" value
 * so we can do simple numeric comparisons across the week.
 */
function toWeekMinutes(dayName, timeStr) {
  const dayIndex = DAY_NAMES.indexOf(dayName);
  if (dayIndex === -1) return 0;
  const { hours, minutes } = parseTime(timeStr);
  return dayIndex * 24 * 60 + hours * 60 + minutes;
}

/**
 * Determine whether the store should currently be closed based on schedule.
 * The closed window spans from closingDay@closingTime to openingDay@openingTime.
 */
function shouldBeClosed(nowDay, nowHours, nowMinutes, user) {
  const nowWeekMin = DAY_NAMES.indexOf(nowDay) * 24 * 60 + nowHours * 60 + nowMinutes;
  const closeMin = toWeekMinutes(user.closingDay, user.closingTime);
  const openMin = toWeekMinutes(user.openingDay, user.openingTime);

  if (closeMin <= openMin) {
    // Simple case: closing and opening within the same week span (e.g. Fri 16:00 → Sat 20:00)
    return nowWeekMin >= closeMin && nowWeekMin < openMin;
  } else {
    // Wraps around the week boundary (e.g. Sat 20:00 → Sun 08:00)
    return nowWeekMin >= closeMin || nowWeekMin < openMin;
  }
}

/**
 * Get current day name, hours, and minutes in the given IANA timezone.
 */
function getNowInTimezone(timezone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const weekday = parts.find(p => p.type === 'weekday').value;
  const hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
  const minute = parseInt(parts.find(p => p.type === 'minute').value, 10);
  return { weekday, hour, minute };
}

/**
 * Fetch the shop's IANA timezone from Shopify and cache it on the User document.
 * Refreshes if not cached or if older than 24 hours.
 */
async function getShopTimezone(user, client) {
  // Use cached timezone if fresh (updated within last 24h)
  if (user.timezone && user.updatedAt && (Date.now() - new Date(user.updatedAt).getTime()) < 24 * 60 * 60 * 1000) {
    return user.timezone;
  }

  const response = await client.request(`
    query {
      shop {
        ianaTimezone
      }
    }
  `);

  const tz = response.data.shop.ianaTimezone;
  if (tz && tz !== user.timezone) {
    await User.findByIdAndUpdate(user._id, { $set: { timezone: tz } });
  }
  return tz;
}

/**
 * Toggle the sabbath mode: update MongoDB and the Shopify metafield.
 */
async function toggleSabbathMode(user, client, newState) {
  await User.findByIdAndUpdate(user._id, { $set: { isSabbathMode: newState } });

  // Get shop GID for metafield mutation
  const shopResponse = await client.request(`
    query {
      shop {
        id
      }
    }
  `);
  const shopGid = shopResponse.data.shop.id;

  const metafieldSetMutation = `
    mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          key
          namespace
          value
          type
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const result = await client.request(metafieldSetMutation, {
    variables: {
      metafields: [{
        key: "sabbath_mode",
        namespace: "custom",
        ownerId: shopGid,
        type: "boolean",
        value: newState.toString()
      }]
    }
  });

  const userErrors = result.data?.metafieldsSet?.userErrors;
  if (userErrors && userErrors.length > 0) {
    console.error(`[Sabbath Worker] Metafield errors for ${user.shop}:`, userErrors);
  }
}

async function processSabbathUsers() {
  const users = await User.find({ isAutoSabbathMode: true });
  if (!users.length) return;

  for (const user of users) {
    try {
      const offlineId = `offline_${user.shop}`;
      const sessionRecord = await shopify.config.sessionStorage.loadSession(offlineId);
      if (!sessionRecord?.accessToken) {
        console.warn(`[Sabbath Worker] No offline session for ${user.shop}, skipping`);
        continue;
      }

      const client = new shopify.api.clients.Graphql({ session: sessionRecord });

      const timezone = await getShopTimezone(user, client);
      if (!timezone) {
        console.warn(`[Sabbath Worker] No timezone for ${user.shop}, skipping`);
        continue;
      }

      const { weekday, hour, minute } = getNowInTimezone(timezone);
      const closed = shouldBeClosed(weekday, hour, minute, user);

      if (closed && !user.isSabbathMode) {
        console.log(`[Sabbath Worker] Closing store: ${user.shop} (${weekday} ${hour}:${String(minute).padStart(2, '0')} ${timezone})`);
        await toggleSabbathMode(user, client, true);
      } else if (!closed && user.isSabbathMode) {
        console.log(`[Sabbath Worker] Opening store: ${user.shop} (${weekday} ${hour}:${String(minute).padStart(2, '0')} ${timezone})`);
        await toggleSabbathMode(user, client, false);
      }
    } catch (err) {
      console.error(`[Sabbath Worker] Error processing ${user.shop}:`, err);
    }
  }
}
