(function() {
  // Get the container element
  const container = document.getElementById('order-cancellation-app');
  if (!container) {
    console.error('Order cancellation container not found');
    return;
  }

  // Get shop details and admin preferences from data attributes
  const shop = container.getAttribute('data-shop');
  const shopName = container.getAttribute('data-shop-name');
  const shopEmail = container.getAttribute('data-shop-email');
  const shopPhone = container.getAttribute('data-shop-phone');
  const shopAddress = container.getAttribute('data-shop-address');
  const buttonText = container.getAttribute('data-button-text') || 'שלח הודעה';
  const buttonColor = container.getAttribute('data-button-color') || '#25D366';

  if (!shop) {
    container.innerHTML = '<p style="color: red;">Error: Shop information not found.</p>';
    return;
  }

  // Function to render the form
  function renderForm() {
    container.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; padding: 20px; display: flex; gap: 20px;">
        <!-- Left Side: Cancellation Policy -->
        <div style="flex: 1; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
          <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 20px;">מדיניות ביטול עסקה</h1>
          <p style="font-size: 14px; font-weight: 500; margin-bottom: 10px;">
            רגע לפני שתבטלו עסקה, אנחנו מזמינים אתכם ליצור איתנו קשר.<br>
            אם בכל זאת החלטתם לבטל, מלאו את פרטיכם בטופס משמאל ואנו ניצור איתכם קשר בהקדם.
          </p>
          <ul style="font-size: 14px; font-weight: 500; line-height: 1.6; padding-left: 20px;">
            <li>א. ביטול עסקה ייעשה תוך 14 ימים מיום קבלת המוצר, או מסמך הגילוי לפי המאוחר ביניהם.</li>
            <li>ב. בהתאם לחוק הגנת הצרכן, בגין ביטול העסקה תחוייבו בדמי ביטול בשיעור של %5 או 100 ש”ח לפי הנמוך ביניהם.</li>
            <li>ג. המוצר יוחזר ככל שהדבר אפשרי באריזתו המקורית.</li>
            <li>ד. החברה תמסור לצרכן עותק של הודעת הזיכוי שמסר העסק לחברת האשראי.</li>
            <li>ה. לא ניתן לבטל רכישה של מוצרים פסידים, מוצרים שיוצרו במיוחד עבור הצרכן וכן מוצרים הניתנים להקלטה, העתקה ושכפול שהצרכן פתח את אריזתם המקורית.</li>
          </ul>
        </div>

        <!-- Right Side: Cancellation Form -->
        <div style="flex: 1; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #fff;">
          <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 20px;">בקשה לביטול עסקה</h2>
          <form id="cancellation-form">
            <div class="form-group" style="margin-bottom: 15px;">
              <label for="fullName" style="display: block; font-size: 14px; font-weight: 700; margin-bottom: 8px;">שם מלא *</label>
              <input type="text" id="fullName" name="fullName" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;" placeholder="שם מלא" required>
            </div>
            <div class="form-group" style="margin-bottom: 15px;">
              <label for="email" style="display: block; font-size: 14px; font-weight: 700; margin-bottom: 8px;">כתובת אימייל *</label>
              <input type="email" id="email" name="email" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;" placeholder="כתובת אימייל" required>
            </div>
            <div class="form-group" style="margin-bottom: 15px;">
              <label for="phone" style="display: block; font-size: 14px; font-weight: 700; margin-bottom: 8px;">מספר טלפון *</label>
              <input type="text" id="phone" name="phone" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;" placeholder="מספר טלפון" required>
            </div>
            <div class="form-group" style="margin-bottom: 15px;">
              <label for="orderNumber" style="display: block; font-size: 14px; font-weight: 700; margin-bottom: 8px;">מספר הזמנה *</label>
              <input type="text" id="orderNumber" name="orderNumber" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;" placeholder="מספר הזמנה" required>
            </div>
            <div class="form-group" style="margin-bottom: 20px;">
              <label for="message" style="display: block; font-size: 14px; font-weight: 700; margin-bottom: 8px;">הודעה *</label>
              <textarea id="message" name="message" style="width: 100%; height: 150px; resize: vertical; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;" placeholder="הודעה"></textarea>
            </div>
            <div style="margin-top: 25px;">
              <button type="submit" style="min-width: 120px; height: 45px; border-radius: 8px; background-color: ${buttonColor}; border: none; color: #FFFFFF; font-size: 16px; font-weight: 500; cursor: pointer; padding: 0 20px;">
                ${buttonText}
              </button>
            </div>
          </form>
          <div id="form-messages" style="margin-top: 15px;"></div>
        </div>
      </div>
    `;

    // Add form submission handler
    const form = document.getElementById('cancellation-form');
    const messages = document.getElementById('form-messages');

    form.addEventListener('submit', function(event) {
      event.preventDefault();

      // Show loading state
      const submitButton = form.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'שולח...';

      // Get form data
      const formData = {
        shop: shop,
        fullName: form.fullName.value,
        email: form.email.value,
        phone: form.phone.value,
        orderNumber: form.orderNumber.value,
        message: form.message.value
      };

      // Submit form using fetch
      fetch('/api/order-cancellation/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          messages.innerHTML = '<div style="padding: 15px; background-color: #d4edda; color: #155724; border-radius: 4px; margin-top: 20px;">בקשת הביטול נשלחה בהצלחה!</div>';
          form.reset();
        } else {
          messages.innerHTML = `<div style="padding: 15px; background-color: #f8d7da; color: #721c24; border-radius: 4px; margin-top: 20px;">שגיאה: ${data.message || 'אירעה שגיאה בשליחת הבקשה'}</div>`;
        }
      })
      .catch(error => {
        console.error('Error:', error);
        messages.innerHTML = '<div style="padding: 15px; background-color: #f8d7da; color: #721c24; border-radius: 4px; margin-top: 20px;">שגיאה בשליחת הבקשה. נא לנסות שוב מאוחר יותר.</div>';
      })
      .finally(() => {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      });
    });
  }

  // Render the form
  renderForm();

  console.log('Order cancellation form initialized successfully');
})();
