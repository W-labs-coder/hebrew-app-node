(function() {
  // Get the container element
  const container = document.getElementById('order-cancellation-app');
  if (!container) {
    console.error('Order cancellation container not found');
    return;
  }
  
  // Get shop details from data attributes
  const shop = container.getAttribute('data-shop');
  const shopName = container.getAttribute('data-shop-name');
  const shopEmail = container.getAttribute('data-shop-email');
  const shopPhone = container.getAttribute('data-shop-phone');
  const shopAddress = container.getAttribute('data-shop-address');
  
  if (!shop) {
    container.innerHTML = '<p style="color: red;">Error: Shop information not found.</p>';
    return;
  }
  
  // Function to render the form
  function renderForm() {
    container.innerHTML = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 class="cancellation-title" style="font-size: 24px; font-weight: 700; margin-bottom: 20px;">ביטול עסקה</h1>
        
        <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
          <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 10px;">פרטי החנות</h2>
          <p style="font-size: 14px; font-weight: 500; margin: 5px 0;">שם החנות: ${shopName || ''}</p>
          <p style="font-size: 14px; font-weight: 500; margin: 5px 0;">אימייל: ${shopEmail || ''}</p>
          <p style="font-size: 14px; font-weight: 500; margin: 5px 0;">טלפון: ${shopPhone || ''}</p>
          <p style="font-size: 14px; font-weight: 500; margin: 5px 0;">כתובת: ${shopAddress || ''}</p>
        </div>
        
        <p style="font-size: 16px; font-weight: 500; color: #666; margin-bottom: 20px;">
          מלאו את הפרטים בטופס הבא כדי להגיש בקשה לביטול עסקה.
        </p>
        
        <form id="cancellation-form">
          <div class="form-group" style="margin-bottom: 15px;">
            <label for="fullName" style="display: block; font-size: 14px; font-weight: 700; margin-bottom: 8px;">שם מלא</label>
            <input type="text" id="fullName" name="fullName" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;" placeholder="הקלד את שמך המלא כאן..." required>
          </div>
          
          <div class="form-group" style="margin-bottom: 15px;">
            <label for="email" style="display: block; font-size: 14px; font-weight: 700; margin-bottom: 8px;">דואר אלקטרוני</label>
            <input type="email" id="email" name="email" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;" placeholder="הקלד את כתובת האימייל שלך כאן..." required>
          </div>
          
          <div class="form-group" style="margin-bottom: 15px;">
            <label for="phone" style="display: block; font-size: 14px; font-weight: 700; margin-bottom: 8px;">מספר טלפון</label>
            <input type="text" id="phone" name="phone" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;" placeholder="הקלד את מספר הטלפון שלך כאן..." required>
          </div>
          
          <div class="form-group" style="margin-bottom: 15px;">
            <label for="orderNumber" style="display: block; font-size: 14px; font-weight: 700; margin-bottom: 8px;">מספר הזמנה</label>
            <input type="text" id="orderNumber" name="orderNumber" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;" placeholder="הקלד את מספר ההזמנה שלך כאן..." required>
          </div>
          
          <div class="form-group" style="margin-bottom: 20px;">
            <label for="message" style="display: block; font-size: 14px; font-weight: 700; margin-bottom: 8px;">הודעה</label>
            <textarea id="message" name="message" style="width: 100%; height: 150px; resize: vertical; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;" placeholder="הקלד כאן הודעה נוספת..."></textarea>
          </div>
          
          <div style="margin-top: 25px;">
            <button type="submit" style="min-width: 120px; height: 45px; border-radius: 8px; background-color: #25D366; border: none; color: #FFFFFF; font-size: 16px; font-weight: 500; cursor: pointer; padding: 0 20px;">
              שלח בקשה
            </button>
          </div>
        </form>
        
        <div id="form-messages" style="margin-top: 15px;"></div>
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
