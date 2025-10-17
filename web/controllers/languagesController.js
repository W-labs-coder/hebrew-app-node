import shopify from "../shopify.js";
import User from "../models/User.js";
import { createTranslationClient, getAIProvider } from "../services/aiProvider.js";
import { translateBatchWithCache } from "../services/translationUtils.js";
import UserSubscription from "../models/UserSubscription.js";
import fs from "fs/promises";
import path from "path";

export const addSelectedLanguage = async (req, res) => {
  try {
    const { language, fast = false, skipAi = false, debugMissing = false } = req.body || {};
    const session = res.locals.shopify.session;

    if (!session) {
      return res.status(401).json({ error: "Unauthorized: Session not found" });
    }

    const shopId = session.shop;

    // Update user's selected language
    const user = await User.findOneAndUpdate(
      { shop: shopId },
      { $set: { selectedLanguage: language } },
      { new: true, upsert: true }
    );

    if (!user.selectedTheme) {
      return res
        .status(400)
        .json({ error: "No theme selected. Please select a theme first." });
    }

    let themeId = user.selectedTheme;
    console.log("Final themeId being used in Admin API:", themeId);

    const client = new shopify.api.clients.Graphql({ session });

    // Confirm theme exists
    const themeResponse = await client.query({
      data: `query {
        theme(id: "${themeId}") {
          id
          name
        }
      }`,
    });

    const theme = themeResponse?.body?.data?.theme;
    if (!theme) {
      return res.status(404).json({ error: "Theme not found" });
    }

    console.log("Theme found:", theme);

    // Extract theme name and clean it for file naming
    // IMPORTANT: Must match generator's cleaning (replace any non a-z0-9 with underscore)
    const themeName = theme.name.toLowerCase().replace(/[^a-z0-9]/g, "_");

    console.log("Theme name for file:", themeName);

    // STEP 1: Normalize and check language code
    const selectedLocaleCode =
      language.toLowerCase() === "hebrew" ? "he" : language.toLowerCase();

    // STEP 2: Fetch available locales
    const localesResponse = await client.query({
      data: {
        query: `query {
          shopLocales {
            locale
            primary
            published
          }
        }`,
      },
    });

    const existingLocales = localesResponse?.body?.data?.shopLocales || [];
    console.log("Published Locales:", existingLocales);

    const isLocaleEnabled = existingLocales.some(
      (locale) => locale.locale === selectedLocaleCode
    );

    // STEP 3: Enable the locale if not already enabled
    if (!isLocaleEnabled) {
      console.log(
        `Locale '${selectedLocaleCode}' not enabled. Enabling it for translation...`
      );

      const enableLocaleResponse = await client.query({
        data: {
          query: `mutation enableLocale($locale: String!) {
            shopLocaleEnable(locale: $locale) {
              userErrors {
                message
                field
              }
              shopLocale {
                locale
                name
                primary
                published
              }
            }
          }`,
          variables: {
            locale: selectedLocaleCode,
          },
        },
      });

      const userErrors = 
        enableLocaleResponse?.body?.data?.shopLocaleEnable?.userErrors || [];

      if (userErrors.length > 0) {
        console.error("Error enabling locale:", userErrors);
        return res.status(400).json({
          error: "Locale could not be enabled for translation",
          details: userErrors,
        });
      }

      console.log(`Locale '${selectedLocaleCode}' enabled successfully.`);
    }

    // Fast path: if requested, simply upload the existing translation file and return quickly
    if (fast) {
      try {
        const translationFilePath = path.join(
          process.cwd(),
          "translations",
          `${theme.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${selectedLocaleCode}.json`
        );
        console.log(`[FAST] Trying to load: ${translationFilePath}`);
        let flat = {};
        try {
          const fileContent = await fs.readFile(translationFilePath, 'utf8');
          flat = JSON.parse(fileContent);
        } catch (e) {
          return res.status(404).json({
            success: false,
            message: "Fast mode: prebuilt translation file not found",
          });
        }

        // Sanitize and upload
        const sanitizedFlat = {};
        for (const [k, v] of Object.entries(flat)) {
          const kk = (k && k.startsWith('t:')) ? k.slice(2) : k;
          sanitizedFlat[kk] = (v === null || v === undefined || v === '') ? ' ' : v;
        }
        const nested = unflattenToNested(sanitizedFlat);
        const rest = new shopify.api.clients.Rest({ session });
        const themeNumericId = themeId.toString().includes('/') ? themeId.toString().split('/').pop() : themeId;
        const assetKey = `locales/${selectedLocaleCode}.json`;
        await rest.put({
          path: `themes/${themeNumericId}/assets`,
          data: { asset: { key: assetKey, value: JSON.stringify(nested) } },
          type: 'application/json',
        });

        // Publish locale (best-effort)
        try {
          await client.query({
            data: {
              query: `mutation updateLocale($locale: String!, $shopLocale: ShopLocaleInput!) {
                shopLocaleUpdate(locale: $locale, shopLocale: $shopLocale) {
                  userErrors { message field }
                  shopLocale { locale published }
                }
              }`,
              variables: { locale: selectedLocaleCode, shopLocale: { published: true } },
            },
          });
        } catch {}

        return res.status(200).json({
          message: "Language added successfully (fast asset upload)",
          user,
          subscription: await UserSubscription.findOne({ shop: user.shop }).sort({ createdAt: -1 }).populate("subscription"),
          mode: 'fast',
          translationStats: {
            uploadedKeys: Object.keys(sanitizedFlat).length,
            verification: 'skipped',
          },
        });
      } catch (fastErr) {
        console.error('[FAST] Failed', fastErr?.message || fastErr);
        // Continue to full path as a fallback
      }
    }

    // STEP 4: Fetch translatable content
    const translatableResourcesResponse = await client.query({
      data: `query {
        translatableResource(resourceId: "${themeId}") {
          resourceId
          translatableContent {
            key
            value
            digest
          }
        }
      }`,
    });

    const translatableContent =
      translatableResourcesResponse?.body?.data?.translatableResource
        ?.translatableContent || [];

    console.log("Fetched translatable content:", translatableContent.length);

    let translationCount = 0;

    // Include ALL keys (even those with empty source values) so Shopify doesn't mark them as missing
    const contentsToTranslate = translatableContent;

    // Log ALL keys to inspect what Shopify expects
    console.log(
      "ALL contentsToTranslate keys:",
      contentsToTranslate.map(c => c.key)
    );


    // Validate translation before adding it
    function validateTranslation(key, value) {
      const MAX_LENGTH = 5000;

      // Check for maximum length
      if (value && value.length > MAX_LENGTH) {
        return {
          isValid: true,
          value: value.substring(0, MAX_LENGTH - 3) + "...",
        };
      }

      // Check for null or undefined values
      if (value === null || value === undefined) {
        return {
          isValid: false,
          reason: "Translation value is null or undefined",
        };
      }

      return { isValid: true, value };
    }

    // Add better error handling and logging for registration
    function unflattenToNested(flat) {
      const out = {};
      for (const [k, v] of Object.entries(flat || {})) {
        const parts = k.split('.');
        let node = out;
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i];
          if (i === parts.length - 1) {
            node[p] = v;
          } else {
            if (!node[p] || typeof node[p] !== 'object') node[p] = {};
            node = node[p];
          }
        }
      }
      return out;
    }

    function flattenNested(obj, prefix = '') {
      const out = {};
      if (!obj || typeof obj !== 'object') return out;
      const recurse = (node, pref) => {
        for (const [k, v] of Object.entries(node)) {
          const key = pref ? `${pref}.${k}` : k;
          if (v && typeof v === 'object' && !Array.isArray(v)) recurse(v, key);
          else out[key] = v;
        }
      };
      recurse(obj, prefix);
      return out;
    }

    // Shopify GraphQL keys may be prefixed with 't:' (translation references)
    // Locale asset files should NOT include this prefix. Sanitize before upload/compare.
    const sanitizeLocaleKey = (key) => (typeof key === 'string' && key.startsWith('t:') ? key.slice(2) : key);
    async function registerTranslations(
      client,
      resourceId,
      translations,
      locale
    ) {
      console.log(
        `Starting registration of ${translations.length} translations`
      );

      // Group translations by batch size (Shopify GraphQL limit ~100)
      const BATCH_SIZE = 100;
      const batches = [];
      for (let i = 0; i < translations.length; i += BATCH_SIZE) {
        batches.push(translations.slice(i, i + BATCH_SIZE));
      }

      console.log(
        `Split into ${batches.length} batches of max ${BATCH_SIZE} translations each`
      );

      let successCount = 0;
      let errorCount = 0;
      let errorSamples = [];

      const CONCURRENCY = 1; // Sequential: ensure one batch completes before the next

      // Define batch processor
      async function processBatch(batch, batchIndex) {
        try {
          console.log(
            `Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} translations...`
          );
          const response = await client.query({
            data: {
              query: `mutation translationsRegister($resourceId: ID!, $translations: [TranslationInput!]!) {
                translationsRegister(resourceId: $resourceId, translations: $translations) {
                  translations {
                    key
                    locale
                  }
                  userErrors {
                    field
                    message
                  }
                }
              }`,
              variables: {
                resourceId,
                translations: batch,
              },
            },
          });

          const result = response?.body?.data?.translationsRegister;
          const userErrors = result?.userErrors || [];

          if (userErrors.length > 0) {
            console.warn(
              `Batch ${batchIndex + 1}/${batches.length}: ${userErrors.length} errors out of ${batch.length} translations`
            );
            userErrors.slice(0, 3).forEach((err) => {
              console.warn(
                `Error: ${err.message} for field: ${err.field || "unknown"}`
              );
            });
            if (errorSamples.length < 10) {
              errorSamples = [...errorSamples, ...userErrors.slice(0, 5)];
            }
            errorCount += userErrors.length;
            successCount += batch.length - userErrors.length;
          } else {
            console.log(
              `✅ Batch ${batchIndex + 1}/${batches.length}: Successfully registered ${batch.length} translations`
            );
            successCount += batch.length;
          }
        } catch (error) {
          console.error(
            `❌ Batch ${batchIndex + 1}/${batches.length} failed with error:`,
            error.message
          );
          errorCount += batch.length;
        }
      }

      // Run batches with concurrency and retry
      await processBatchesWithConcurrency(batches, CONCURRENCY, processBatch);

      // Log summary
      console.log(`\n=== Translation Registration Summary ===`);
      console.log(`Total translations attempted: ${translations.length}`);
      console.log(
        `Successfully registered: ${successCount} (${Math.round(
          (successCount / translations.length) * 100
        )}%)`
      );
      console.log(`Failed registrations: ${errorCount}`);

      if (errorSamples.length > 0) {
        console.log(`\n=== Sample Error Messages ===`);
        errorSamples.forEach((err, i) => {
          console.log(
            `${i + 1}. Field: ${err.field || "unknown"}, Message: ${
              err.message
            }`
          );
        });
      }

      return {
        total: translations.length,
        success: successCount,
        errors: errorCount,
      };
    }

    // NEW APPROACH: Use JSON files directly for translations
    let translationData = {};
    // Ensure stats variables are defined for final response
    let placeholdersApplied = 0;
    let missingKeys = [];
    let untranslatedKeys = [];
    let finalMissingCount = undefined;
    let assetUploadSucceeded = false;
    let finalMissingKeysList = [];
    try {
      // Define file path for translation file
      const translationFilePath = path.join(
        process.cwd(),
        "translations",
        `${themeName}_${selectedLocaleCode}.json`
      );

      console.log(`Looking for translation file: ${translationFilePath}`);

      // Attempt to load pre-generated translations; if missing, continue with empty map
      let flatTranslationData = {};
      try {
        await fs.access(translationFilePath);
        const fileContent = await fs.readFile(translationFilePath, "utf8");
        flatTranslationData = JSON.parse(fileContent);
        console.log(`Loaded existing translation file with ${Object.keys(flatTranslationData).length} entries`);
      } catch (fileNotFound) {
        console.warn(`Translation file not found: ${translationFilePath}. Proceeding with fallbacks (no 404).`);
      }

      // Attempt to translate any missing or untranslated keys before registration
      console.log(`Preparing translations (including filling missing/untranslated via AI if available)...`);

      // Initialize AI client (optional) unless explicitly skipped
      let openai = null;
      if (!skipAi) {
        try {
          openai = createTranslationClient();
          console.log(`[AddLanguage] Provider: ${getAIProvider()}`);
        } catch (e) {
          console.warn('[AddLanguage] AI not configured; proceeding without on-the-fly translation');
        }
      } else {
        console.log('[AddLanguage] Skipping AI translation as requested');
      }

      // Build list of items requiring translation
      const toTranslateIdx = [];
      const toTranslateValues = [];
      contentsToTranslate.forEach((content, idx) => {
        const src = (content.value || '').toString();
        const existing = flatTranslationData && Object.prototype.hasOwnProperty.call(flatTranslationData, content.key)
          ? (flatTranslationData[content.key] ?? '')
          : undefined;
        const needs = existing === undefined || existing === null || existing === '' || existing === src;
        if (needs && src.trim() !== '') {
          toTranslateIdx.push(idx);
          toTranslateValues.push(src);
        }
      });

      // Translate missing/untranslated values and merge back into flatTranslationData
      if (openai && toTranslateValues.length > 0) {
        try {
          console.log(`[AddLanguage] Translating ${toTranslateValues.length} missing/untranslated strings...`);
          const translated = await translateBatchWithCache(openai, toTranslateValues, selectedLocaleCode);
          toTranslateIdx.forEach((origIdx, i) => {
            const key = contentsToTranslate[origIdx].key;
            const tval = translated[i];
            if (tval !== undefined && tval !== null) {
              flatTranslationData[key] = tval;
            }
          });
          // Persist updated translation file for future runs
          try {
            await fs.mkdir(path.dirname(translationFilePath), { recursive: true });
          } catch {}
          await fs.writeFile(translationFilePath, JSON.stringify(flatTranslationData, null, 2), 'utf8');
          console.log(`[AddLanguage] Updated translation file saved (${Object.keys(flatTranslationData).length} entries)`);
        } catch (e) {
          console.warn('[AddLanguage] Inline translation failed; continuing with fallbacks:', e?.message || e);
        }
      }

      // Second pass: attempt to re-translate items that remained identical to source
      if (openai) {
        const unchangedIdx = [];
        const unchangedValues = [];
        contentsToTranslate.forEach((content, idx) => {
          const src = (content.value || '').toString();
          const cur = flatTranslationData && Object.prototype.hasOwnProperty.call(flatTranslationData, content.key)
            ? (flatTranslationData[content.key] ?? '')
            : '';
          if (src.trim() !== '' && cur === src) {
            unchangedIdx.push(idx);
            unchangedValues.push(src);
          }
        });
        if (unchangedValues.length > 0) {
          try {
            console.log(`[AddLanguage] Second-pass translating ${unchangedValues.length} unchanged strings...`);
            const translated2 = await translateBatchWithCache(openai, unchangedValues, selectedLocaleCode);
            unchangedIdx.forEach((origIdx, i) => {
              const key = contentsToTranslate[origIdx].key;
              const tval = translated2[i];
              if (tval !== undefined && tval !== null) {
                flatTranslationData[key] = tval;
              }
            });
            await fs.writeFile(translationFilePath, JSON.stringify(flatTranslationData, null, 2), 'utf8');
          } catch (e) {
            console.warn('[AddLanguage] Second-pass translation failed; proceeding:', e?.message || e);
          }
        }
      }

      // Ensure every key has some value in the file to avoid "missing" status
      contentsToTranslate.forEach((content) => {
        if (!Object.prototype.hasOwnProperty.call(flatTranslationData || {}, content.key)) {
          const src = (content.value ?? '').toString();
          flatTranslationData[content.key] = src === '' ? ' ' : src;
        }
      });
      try {
        await fs.writeFile(translationFilePath, JSON.stringify(flatTranslationData, null, 2), 'utf8');
      } catch {}

      // Create translations from the (now updated) flat JSON data
      console.log(`Preparing translations for registration...`);
      

      // Create a set of Shopify keys for faster lookup
      const shopifyKeys = new Set(contentsToTranslate.map((c) => c.key));
      // Create a digest map for faster access
      const digestMap = {};
      contentsToTranslate.forEach((content) => {
        digestMap[content.key] = content.digest;
      });

      let translations = [];


      // Add translations for all Shopify keys (even if missing in JSON)
      // Count placeholders when substituting empty strings
      for (const content of contentsToTranslate) {
        // Prefer saved translation, fall back to source value, then to empty string
        let value = (flatTranslationData && Object.prototype.hasOwnProperty.call(flatTranslationData, content.key))
          ? flatTranslationData[content.key]
          : (content.value ?? "");

        // Track missing/untranslated cases
        if (
          flatTranslationData == null ||
          !Object.prototype.hasOwnProperty.call(flatTranslationData, content.key)
        ) {
          missingKeys.push(content.key);
        }
        if (typeof content.value === 'string' && value === content.value) {
          untranslatedKeys.push(content.key);
        }

        // Ensure we don't drop keys due to null/undefined; use a single space to avoid Shopify marking as missing
        if (value === null || value === undefined) value = "";
        if (value === "") { value = " "; placeholdersApplied++; }

        const validationResult = validateTranslation(content.key, value);
        if (validationResult.isValid) {
          translations.push({
            key: content.key,
            locale: selectedLocaleCode,
            value: validationResult.value,
            translatableContentDigest: content.digest,
          });
        } else {
          console.warn(
            `Skipping invalid translation for key "${content.key}": ${validationResult.reason}`
          );
        }
      }

      // Include any keys present in the saved JSON but not returned by Shopify (no digest available)
      for (const [key, raw] of Object.entries(flatTranslationData || {})) {
        if (shopifyKeys.has(key)) continue;
        let value = raw;
        if (value === null || value === undefined) value = '';
        if (value === '') value = ' ';
        const validationResult = validateTranslation(key, value);
        if (validationResult.isValid) {
          translations.push({
            key,
            locale: selectedLocaleCode,
            value: validationResult.value,
          });
        }
      }

      console.log(
        `Prepared ${translations.length} translations (including ${missingKeys.length} missing and ${untranslatedKeys.length} untranslated keys)`
      );

      if (missingKeys.length > 0) {
        console.warn(
          `WARNING: ${missingKeys.length} keys had no translation and used fallback values.`
        );
        console.warn("Sample missing keys:", missingKeys.slice(0, 10));
      }
      if (untranslatedKeys.length > 0) {
        console.warn(
          `WARNING: ${untranslatedKeys.length} keys are untranslated (same as original value).`
        );
        console.warn("Sample untranslated keys:", untranslatedKeys.slice(0, 10));
      }

      // Fetch the actual keys in use for this theme and locale
      

      console.log(
        `Prepared ${translations.length} translations for keys in use (including ${missingKeys.length} missing and ${untranslatedKeys.length} untranslated)`
      );

      // Fast path: upload the full locale JSON as a single asset first
      // This avoids slow GraphQL batching and reduces missing keys
      try {
        const rest = new shopify.api.clients.Rest({ session });
        // Sanitize keys for locale asset (strip leading 't:')
        const sanitizedFlat = {};
        for (const [k, v] of Object.entries(flatTranslationData || {})) {
          sanitizedFlat[sanitizeLocaleKey(k)] = v;
        }
        const nested = unflattenToNested(sanitizedFlat);
        const themeNumericId = themeId.toString().includes('/') ? themeId.toString().split('/').pop() : themeId;
        const assetKey = `locales/${selectedLocaleCode}.json`;
        console.log(`Uploading full locale asset first: ${assetKey} ...`);
        await rest.put({
          path: `themes/${themeNumericId}/assets`,
          data: { asset: { key: assetKey, value: JSON.stringify(nested) } },
          type: 'application/json',
        });
        console.log('Full locale asset uploaded successfully. Verifying...');

        // Verify by fetching the asset and computing remaining missing keys
        const getRes = await rest.get({
          path: `themes/${themeNumericId}/assets`,
          query: { 'asset[key]': assetKey }
        });
        const assetVal = getRes?.body?.asset?.value || '';
        let parsed = {};
        try { parsed = JSON.parse(assetVal); } catch {}
        const flatFromTheme = flattenNested(parsed);
        // Compute remaining missing and patch if needed
        const stillMissingAfterUpload = contentsToTranslate
          .map(c => sanitizeLocaleKey(c.key))
          .filter(k => flatFromTheme[k] === undefined);
        finalMissingCount = stillMissingAfterUpload.length;
        finalMissingKeysList = stillMissingAfterUpload;
        if (stillMissingAfterUpload.length > 0) {
          console.log(`Asset verify (fast path): ${stillMissingAfterUpload.length} keys missing; patching and re-uploading...`);
          const nestedPatched = unflattenToNested({
            ...flatFromTheme,
            ...Object.fromEntries(stillMissingAfterUpload.map(k => [k, sanitizedFlat[k] ?? ' ']))
          });
          await rest.put({
            path: `themes/${themeNumericId}/assets`,
            data: { asset: { key: assetKey, value: JSON.stringify(nestedPatched) } },
            type: 'application/json',
          });
          // Recalculate after patch
          const getRes2 = await rest.get({
            path: `themes/${themeNumericId}/assets`,
            query: { 'asset[key]': assetKey }
          });
          let parsed2 = {};
          try { parsed2 = JSON.parse(getRes2?.body?.asset?.value || ''); } catch {}
          const flat2 = flattenNested(parsed2);
          finalMissingCount = contentsToTranslate
            .map(c => sanitizeLocaleKey(c.key))
            .filter(k => flat2[k] === undefined).length;
          finalMissingKeysList = contentsToTranslate
            .map(c => sanitizeLocaleKey(c.key))
            .filter(k => flat2[k] === undefined);
          translationCount = contentsToTranslate.length - finalMissingCount;
        } else {
          translationCount = contentsToTranslate.length - finalMissingCount;
        }
        assetUploadSucceeded = true;
      } catch (assetErr) {
        console.error('Preferred asset upload failed; will attempt GraphQL registration:', assetErr?.message || assetErr);
      }

      // Register all translations (fallback) if asset upload did not succeed
      if (!assetUploadSucceeded) {
      let translatedResourceId = themeId;
      if (!translatedResourceId.startsWith("gid://")) {
        translatedResourceId = `gid://shopify/Theme/${themeId
          .split("/")
          .pop()}`;
      }

      const registrationResult = await registerTranslations(
        client,
        translatedResourceId,
        translations,
        selectedLocaleCode
      );

      translationCount = registrationResult.success;

      // Verify translations actually appeared in the locale file
      console.log("Verifying translations were actually applied...");
      try {
        // Wait a moment for translations to be processed
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Fetch the actual translations from the theme using the correct query structure
        const localeResponse = await client.query({
          data: `query {
            translatableResource(resourceId: "${translatedResourceId}") {
              resourceId
              translations(locale: "${selectedLocaleCode}") {
                key
                value
              }
            }
          }`,
        });

        const appliedTranslations =
          localeResponse?.body?.data?.translatableResource?.translations || [];
        console.log(
          `Fetched ${appliedTranslations.length} actual translations from locale file`
        );

        // Check if critical keys actually exist in the applied translations
        console.log("Verifying critical translations were actually applied...");
        const criticalKeys = [
          "general.password_page.login_form_heading",
          "general.password_page.login_password_button",
          "general.social.links.facebook",
          "general.social.links.twitter",
        ];

        criticalKeys.forEach((key) => {
          const foundInLocale = appliedTranslations.some((t) => t.key === key);
          console.log(
            `Critical key "${key}": ${
              foundInLocale ? "✅ Applied" : "❌ Missing in locale file"
            }`
          );
        });

        // Calculate overall application rate
        const totalKeysFound = translations.filter((t) =>
          appliedTranslations.some((at) => at.key === t.key)
        ).length;

        console.log(`=== TRANSLATION APPLICATION SUMMARY ===`);
        console.log(`Total translations attempted: ${translations.length}`);
        console.log(
          `Actually found in locale file: ${totalKeysFound} (${Math.round(
            (totalKeysFound / translations.length) * 100
          )}%)`
        );

        // Update translated count to reflect actually applied translations
        translationCount = totalKeysFound;

        // Second pass: try to fill any missing keys without digest as a fallback
        const appliedSet = new Set(appliedTranslations.map((t) => t.key));
        // Consider both Shopify-reported keys and any extra keys from the JSON file
        const stillMissingShopify = contentsToTranslate.filter((c) => !appliedSet.has(c.key));
        const extraJsonKeys = Object.keys(flatTranslationData || {}).filter(k => !shopifyKeys.has(k));
        const stillMissingExtra = extraJsonKeys.filter(k => !appliedSet.has(k)).map(k => ({ key: k }));
        const stillMissing = [...stillMissingShopify, ...stillMissingExtra];
        const missingCount = stillMissing.length;
        console.log(`Second pass: ${stillMissing.length} keys still missing after first registration`);

        finalMissingCount = missingCount;
        if (missingCount > 0) {
          const secondPass = stillMissing.map((content) => {
            let val = (flatTranslationData && Object.prototype.hasOwnProperty.call(flatTranslationData, content.key))
              ? flatTranslationData[content.key]
              : (content.value ?? " ");
            if (val === null || val === undefined || val === "") val = " ";
            return {
              key: content.key,
              locale: selectedLocaleCode,
              value: val,
              // no translatableContentDigest to avoid digest mismatch blocking
            };
          });

          const secondResult = await registerTranslations(
            client,
            translatedResourceId,
            secondPass,
            selectedLocaleCode
          );
          console.log(`Second pass registered: ${secondResult.success}/${secondResult.total}`);
          translationCount += secondResult.success;
        }

        // If some keys are still missing after second pass, push the full locale file as a last resort
        if (missingCount > 0) {
          try {
            const rest = new shopify.api.clients.Rest({ session });
            // Recreate sanitized payload for asset upload
            const sanitizedFlat = {};
            for (const [k, v] of Object.entries(flatTranslationData || {})) {
              sanitizedFlat[sanitizeLocaleKey(k)] = v;
            }
            const nested = unflattenToNested(sanitizedFlat);
            const themeNumericId = themeId.toString().includes('/') ? themeId.toString().split('/').pop() : themeId;
            const assetKey = `locales/${selectedLocaleCode}.json`;
            console.log(`Attempting asset upload for ${assetKey} with ${Object.keys(flatTranslationData || {}).length} keys...`);
            await rest.put({
              path: `themes/${themeNumericId}/assets`,
              data: { asset: { key: assetKey, value: JSON.stringify(nested) } },
              type: 'application/json',
            });
            console.log('Locale asset uploaded successfully via REST.');

            // Verify by fetching the asset and computing remaining missing keys
            const getRes = await rest.get({
              path: `themes/${themeNumericId}/assets`,
              query: { 'asset[key]': assetKey }
            });
            const assetVal = getRes?.body?.asset?.value || '';
            let parsed = {};
            try { parsed = JSON.parse(assetVal); } catch {}
            const flatFromTheme = flattenNested(parsed);

            // Compute remaining missing and patch the nested object if needed
            const stillMissingAfterUpload = contentsToTranslate
              .map(c => sanitizeLocaleKey(c.key))
              .filter(k => flatFromTheme[k] === undefined);
            finalMissingCount = stillMissingAfterUpload.length;
            finalMissingKeysList = stillMissingAfterUpload;
            if (stillMissingAfterUpload.length > 0) {
              console.log(`Asset verify: ${stillMissingAfterUpload.length} keys still missing, patching and re-uploading...`);
              const nestedPatched = unflattenToNested({
                ...flatFromTheme,
                ...Object.fromEntries(stillMissingAfterUpload.map(k => [k, sanitizedFlat[k] ?? ' ']))
              });
              await rest.put({
                path: `themes/${themeNumericId}/assets`,
                data: { asset: { key: assetKey, value: JSON.stringify(nestedPatched) } },
                type: 'application/json',
              });
              console.log('Patched locale asset re-uploaded.');

              // Recalculate after patch
              const getRes2 = await rest.get({
                path: `themes/${themeNumericId}/assets`,
                query: { 'asset[key]': assetKey }
              });
              let parsed2 = {};
              try { parsed2 = JSON.parse(getRes2?.body?.asset?.value || ''); } catch {}
              const flat2 = flattenNested(parsed2);
              finalMissingCount = contentsToTranslate
                .map(c => sanitizeLocaleKey(c.key))
                .filter(k => flat2[k] === undefined).length;
              finalMissingKeysList = contentsToTranslate
                .map(c => sanitizeLocaleKey(c.key))
                .filter(k => flat2[k] === undefined);
              translationCount = contentsToTranslate.length - finalMissingCount;
            } else {
              translationCount = contentsToTranslate.length - finalMissingCount;
            }
          } catch (assetErr) {
            console.error('Failed to upload full locale asset:', assetErr?.message || assetErr);
          }
        }
      } catch (verifyError) {
        console.error(`Error verifying translations: ${verifyError.message}`);
      }

      // Special handling for password page and social translations
      console.log(
        "Verifying specific translations were registered correctly..."
      );
      const criticalKeys = [
        "general.password_page.login_form_heading",
        "general.password_page.login_password_button",
        "general.social.links.facebook",
        "general.social.links.twitter",
      ];

      criticalKeys.forEach((key) => {
        const foundInBatch = translations.some((t) => t.key === key);
        console.log(
          `Critical key "${key}": ${
            foundInBatch ? "✅ Registered" : "❌ Not found in translations" 
          }`
        );
      });
      }
    } catch (fileError) {
      console.error(`Error processing translation file: ${fileError.message}`);
      return res.status(500).json({
        success: false,
        message: "Error processing translation file",
        error: fileError.message,
      });
    }

    // Add this after translation verification, before sending the response
    console.log(`Publishing locale '${selectedLocaleCode}' to make it available in storefront...`);
    try {
      const publishLocaleResponse = await client.query({
        data: {
          query: `mutation updateLocale($locale: String!, $shopLocale: ShopLocaleInput!) {
            shopLocaleUpdate(locale: $locale, shopLocale: $shopLocale) {
              userErrors {
                message
                field
              }
              shopLocale {
                name
                locale
                primary
                published
              }
            }
          }`,
          variables: {
            locale: selectedLocaleCode,
            shopLocale: {
              published: true
            }
          },
        },
      });

      const userErrors = publishLocaleResponse?.body?.data?.shopLocaleUpdate?.userErrors || [];
      
      if (userErrors.length > 0) {
        console.error("Error publishing locale:", userErrors);
        console.warn("Translations were added but the language might not be publicly available");
      } else {
        const publishedLocale = publishLocaleResponse?.body?.data?.shopLocaleUpdate?.shopLocale;
        console.log(`✅ Locale '${publishedLocale.locale}' published successfully and is now available in the storefront`);
      }
    } catch (publishError) {
      console.error(`Error publishing locale: ${publishError.message}`);
      console.warn("Translations were added but the language might not be publicly available");
    }

    // Check if the locale is already published
    console.log(`Checking if locale '${selectedLocaleCode}' is published...`);
    try {
      const localeStatusResponse = await client.query({
        data: {
          query: `query {
            shopLocales {
              locale
              published
            }
          }`,
        },
      });
      
      const currentLocales = localeStatusResponse?.body?.data?.shopLocales || [];
      const localeStatus = currentLocales.find(locale => locale.locale === selectedLocaleCode);
      
      if (localeStatus) {
        if (localeStatus.published) {
          console.log(`✅ Locale '${selectedLocaleCode}' is already published and available in the storefront`);
        } else {
          console.log(`⚠️ Locale '${selectedLocaleCode}' is enabled but not published. This might be handled differently in newer Shopify API versions.`);
        }
      } else {
        console.log(`⚠️ Could not find status for locale '${selectedLocaleCode}'`);
      }
      
    } catch (statusError) {
      console.error(`Error checking locale status: ${statusError.message}`);
    }

    const subscription = await UserSubscription.findOne({ shop: user.shop })
      .sort({ createdAt: -1 })
      .populate("subscription");

    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "No subscription found" });
    }

    const currentDate = new Date();

    if (currentDate > subscription.endDate) {
      return res.status(403).json({
        success: false,
        message: "Subscription has expired",
      });
    }

    res.status(200).json({
      message: "Language added successfully and sample translations completed",
      user,
      subscription,
      translationStats: {
        translatedItems: translationCount,
        totalTranslatableItems: translatableContent.length,
        missingKeysCount: (typeof finalMissingCount === 'number' ? finalMissingCount : (typeof missingKeys !== 'undefined' ? missingKeys.length : undefined)),
        untranslatedKeysCount: (typeof untranslatedKeys !== 'undefined' ? untranslatedKeys.length : undefined),
        placeholdersApplied,
        missingKeysSample: Array.isArray(finalMissingKeysList) ? finalMissingKeysList.slice(0, 50) : undefined,
        missingKeys: debugMissing ? finalMissingKeysList : undefined,
      },
    });
  } catch (error) {
    console.error("Error adding language or translating theme:", error);
    res.status(500).json({
      message: "Error adding language or translating theme",
      error: error.message,
    });
  }
};

// GET /api/settings/inspect-missing-translations
// Returns counts and samples of missing translation keys for the selected theme + locale
export const inspectMissingTranslations = async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    if (!session) {
      return res.status(401).json({ success: false, error: "Unauthorized: Session not found" });
    }

    // Resolve user and theme
    const shopId = session.shop;
    const user = await User.findOne({ shop: shopId });
    if (!user || !user.selectedTheme) {
      return res.status(400).json({ success: false, error: "No theme selected for this shop" });
    }

    let themeId = user.selectedTheme; // can be gid or numeric
    const client = new shopify.api.clients.Graphql({ session });

    // Determine locale from query or user selection
    const { language, locale, full } = req.query || {};
    const selectedLanguage = language || user.selectedLanguage || 'hebrew';
    const selectedLocaleCode = (locale || (selectedLanguage.toLowerCase() === 'hebrew' ? 'he' : selectedLanguage.toLowerCase())).trim();

    // Helpers (local to this function)
    const sanitizeLocaleKey = (key) => (typeof key === 'string' && key.startsWith('t:') ? key.slice(2) : key);
    const flattenNested = (obj, prefix = '') => {
      const out = {};
      if (!obj || typeof obj !== 'object') return out;
      const recurse = (node, pref) => {
        for (const [k, v] of Object.entries(node)) {
          const kk = pref ? `${pref}.${k}` : k;
          if (v && typeof v === 'object' && !Array.isArray(v)) recurse(v, kk);
          else out[kk] = v;
        }
      };
      recurse(obj, prefix);
      return out;
    };

    // Confirm theme exists and get name
    const themeResp = await client.query({
      data: `query { theme(id: "${themeId}") { id name } }`,
    });
    const theme = themeResp?.body?.data?.theme;
    if (!theme) return res.status(404).json({ success: false, error: 'Theme not found' });

    // Fetch Shopify translatable keys and already-applied translations
    const transResp = await client.query({
      data: `query { translatableResource(resourceId: "${themeId}") { resourceId translatableContent { key } translations(locale: "${selectedLocaleCode}") { key value } } }`,
    });
    const resource = transResp?.body?.data?.translatableResource || {};
    const shopifyKeys = (resource.translatableContent || []).map(c => c.key);
    const appliedTranslations = (resource.translations || []).map(t => t.key);

    // Fetch current locale asset (REST)
    const rest = new shopify.api.clients.Rest({ session });
    const themeNumericId = theme.id ? theme.id.toString().split('/').pop() : (themeId.toString().includes('/') ? themeId.toString().split('/').pop() : themeId);
    const assetKey = `locales/${selectedLocaleCode}.json`;

    let assetFlat = {};
    try {
      const getRes = await rest.get({ path: `themes/${themeNumericId}/assets`, query: { 'asset[key]': assetKey } });
      const assetVal = getRes?.body?.asset?.value || '';
      try { assetFlat = flattenNested(JSON.parse(assetVal)); } catch { assetFlat = {}; }
    } catch (e) {
      // If asset missing, keep empty map
      assetFlat = {};
    }

    // Build sets
    const setFrom = (arr) => new Set(arr);
    const diff = (a, bSet) => a.filter(k => !bSet.has(k));

    // Compare against asset (sanitize keys from Shopify)
    const shopifyKeysSan = shopifyKeys.map(sanitizeLocaleKey);
    const assetKeys = Object.keys(assetFlat);
    const missingFromAsset = diff(shopifyKeysSan, setFrom(assetKeys));

    // Compare against GraphQL translations list (no sanitize, since it returns raw keys)
    const missingFromGraphql = diff(shopifyKeys, setFrom(appliedTranslations));

    // Response
    const wantFullAsset = full === 'asset' || full === 'both' || full === '1' || full === 'true';
    const wantFullGraphql = full === 'graphql' || full === 'both' || full === '1' || full === 'true';

    return res.status(200).json({
      success: true,
      theme: { id: theme.id, name: theme.name },
      locale: selectedLocaleCode,
      counts: {
        totalTranslatable: shopifyKeys.length,
        missingFromAsset: missingFromAsset.length,
        missingFromGraphql: missingFromGraphql.length,
      },
      samples: {
        missingFromAsset: missingFromAsset.slice(0, 50),
        missingFromGraphql: missingFromGraphql.slice(0, 50),
      },
      lists: {
        missingFromAsset: wantFullAsset ? missingFromAsset : undefined,
        missingFromGraphql: wantFullGraphql ? missingFromGraphql : undefined,
      }
    });
  } catch (error) {
    console.error('inspectMissingTranslations error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Helper: Retry a batch up to N times with delay
async function retryBatch(fn, retries = 2, delayMs = 0) {
  let lastError;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < retries) await new Promise(res => setTimeout(res, delayMs));
    }
  }
  throw lastError;
}

// Optimized batch processing with lower concurrency and retry
async function processBatchesWithConcurrency(batches, CONCURRENCY, processBatch) {
  let index = 0;
  async function worker() {
    while (index < batches.length) {
      const current = index++;
      await retryBatch(() => processBatch(batches[current], current));
      // Optional: add a small delay to avoid rate limits
    
    }
  }
  await Promise.all(Array(CONCURRENCY).fill(0).map(worker));
}
