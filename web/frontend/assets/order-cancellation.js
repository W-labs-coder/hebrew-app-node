(function() {
  let store;
  try {
    if (typeof window.STORE_DATA === 'string') {
      store = JSON.parse(window.STORE_DATA);
    } else {
      store = window.STORE_DATA;
    }
    
    if (!store || typeof store !== 'object') {
      throw new Error('Invalid store data format');
    }
  } catch (err) {
    console.error('Error parsing store data:', err);
    const container = document.getElementById('order-cancellation-app');
    if (container) {
      container.innerHTML = '<p style="color: red; padding: 20px;">Error loading store configuration. Please try again later.</p>';
    }
    return;
  }

  const host = window.APP_HOST;

  // Function to dynamically load the CSS file
  function loadCSS(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    document.head.appendChild(link);
  }

  // Load the CSS file
  loadCSS('/frontend/assets/order-cancellation.css');

  // Get the container element
  const container = document.getElementById('order-cancellation-app');
  if (!container) {
    console.error('Order cancellation container not found');
    return;
  }

  // Get shop details and admin preferences from data attributes
  const shopName = container.getAttribute('data-shop-name');
  const shopEmail = container.getAttribute('data-shop-email');
  const shopPhone = container.getAttribute('data-shop-phone');
  const shopAddress = container.getAttribute('data-shop-address');
  const buttonText = container.getAttribute('data-button-text') || 'שלח הודעה';
  const buttonColor = container.getAttribute('data-button-color') || '#25D366';

  if (!store) {
    container.innerHTML = '<p style="color: red;">Error: Shop information not found.</p>';
    return;
  }

  // Function to render the form
  function renderForm() {
    container.innerHTML = `
    <!-- Modal -->
    <div id="termsModal" class="modal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5);">
      <div class="modal-content" style="background-color: ${store?.termOfUseBgColor}; margin: 15% auto; padding: 20px; border: 1px solid #888; width: 80%; max-width: 700px; border-radius: 8px; position: relative;">
        <span class="close" style="position: absolute; right: 15px; top: 10px; font-size: 24px; cursor: pointer; color: #666;">&times;</span>
        <h2 style="color: ${store?.termOfUseTextColor}">תנאי שימוש</h2>
        <div id="termsContent" style="max-height: 60vh; overflow-y: auto;">

        <p style="color: ${store?.termOfUseTextColor}">${store?.termOfUseShortMessage}</p>

        <div style="color: ${store?.termOfUseTextColor}; display:flex; gap:3px; justify-content:center; align-items:center">
        <p>
        ${store?.termOfUseFullName}
        </p>
        <p>
        ${store?.termOfUseEmail}
        </p>
        <p>
        ${store?.termOfUsePhone}
        </p>
        </div>
          <a href="${store?.linkTermOfUseWebsite}" style="width: 100%; border: none;"></a>
        </div>
      </div>
    </div>

    <div>
      <h1 style="font-size: 32px; font-weight: 700; text-align: center; margin-bottom: 20px;">${store?.pageTitle}</h1>
      
      <div style="max-width: 100%; margin: 0 auto; padding: 20px; display: flex; gap: 20px;">
      <!-- Left Side: Cancellation Policy -->
        <div style="flex: 1; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
        <h2 style="font-size: 32px; font-weight: 700; text-align: center; margin-bottom: 20px;">${store?.titleOfCancellationCondition}</h2>
          <p>${store?.cancellationConditions}</p>
          <button id="openTermsBtn" style="background-color:${store?.termOfUseBtnBackgroundColor}; color: ${store?.termOfUseBtnTextColor}; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-bottom: 15px;">
            ${store?.termOfUseButtonText}
          </button>
        </div>

        <!-- Right Side: Cancellation Form -->
        <div style="flex: 1; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #fff;">
          <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 20px;">${store?.formTitle}</h2>
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
              <button type="submit" style="min-width: 120px; height: 45px; border-radius: 8px; background-color:${store?.termOfUseBtnBackgroundColor}; color: ${store?.termOfUseBtnTextColor}; border: none; font-size: 16px; font-weight: 500; cursor: pointer; padding: 0 20px;">
                ${buttonText}
              </button>
            </div>
          </form>
          <div id="form-messages" style="margin-top: 15px;"></div>
        </div>
      </div>
      </div>
    `;

    // Add modal functionality
    const modal = document.getElementById("termsModal");
    const openTermsBtn = document.getElementById("openTermsBtn");
    const closeBtn = document.querySelector(".close");

    openTermsBtn.onclick = function() {
      modal.style.display = "block";
    }

    closeBtn.onclick = function() {
      modal.style.display = "none";
    }

    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    }

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
        shop: store?.shop,
        fullName: form.fullName.value,
        email: form.email.value,
        phone: form.phone.value,
        orderNumber: form.orderNumber.value,
        message: form.message.value
      };

      // Submit form using fetch
      fetch(`${host}/cancel-order/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          if (data.success) {
            messages.innerHTML =
              '<div style="padding: 15px; background-color: #d4edda; color: #155724; border-radius: 4px; margin-top: 20px;">בקשת הביטול נשלחה בהצלחה!</div>';
            form.reset();
          } else {
            messages.innerHTML = `<div style="padding: 15px; background-color: #f8d7da; color: #721c24; border-radius: 4px; margin-top: 20px;">שגיאה: ${
              data.message || "אירעה שגיאה בשליחת הבקשה"
            }</div>`;
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          messages.innerHTML =
            '<div style="padding: 15px; background-color: #f8d7da; color: #721c24; border-radius: 4px; margin-top: 20px;">שגיאה בשליחת הבקשה. נא לנסות שוב מאוחר יותר.</div>';
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
