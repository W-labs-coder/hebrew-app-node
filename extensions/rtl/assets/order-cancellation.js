/*
  Minimal storefront script for the Order Cancellation Form block.
  - Attaches submit handler
  - Validates basic fields
  - Shows success/failure messages inline

  NOTE: This is a lightweight placeholder so the asset exists and the block works.
  To submit to your app backend, call a proxy endpoint such as `/apps/order-cancellation/submit`
  and handle it server-side. This file intentionally avoids cross-origin calls.
*/
(function () {
  function $(sel, root) { return (root || document).querySelector(sel); }

  document.addEventListener('DOMContentLoaded', function () {
    var appRoot = $('#order-cancellation-app');
    if (!appRoot) return;

    var form = $('#cancellation-form', appRoot);
    var msg = $('#form-messages', appRoot);
    if (!form || !msg) return;

    function setMessage(text, ok) {
      msg.style.padding = '10px';
      msg.style.borderRadius = '6px';
      msg.style.background = ok ? '#e7f6ee' : '#fdecea';
      msg.style.color = ok ? '#0f5132' : '#b02a37';
      msg.style.border = ok ? '1px solid #badbcc' : '1px solid #f5c2c7';
      msg.textContent = text;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fullName = $('#fullName', form)?.value?.trim();
      var email = $('#email', form)?.value?.trim();
      var phone = $('#phone', form)?.value?.trim();
      var orderNumber = $('#orderNumber', form)?.value?.trim();
      var message = $('#message', form)?.value?.trim();

      if (!fullName || !email || !phone || !orderNumber) {
        setMessage('נא למלא את כל השדות החובה (שם, אימייל, טלפון, מספר הזמנה).', false);
        return;
      }

      // Placeholder success UI. Replace with a fetch to your proxy endpoint if needed.
      setMessage('הבקשה נשלחה בהצלחה. ניצור קשר בהקדם.', true);
      form.reset();
    });
  });
})();

