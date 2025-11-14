import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Frame, Layout, Page } from "@shopify/polaris";
import Input from "../components/form/Input";
import Button from "../components/form/Button";
import CheckLightIcon from "../components/svgs/CheckLightIcon";
import CancelIcon from "../components/svgs/CancelIcon";
import AlertIcon3 from "../components/svgs/AlertIcon3";
import RtlImage from "../components/svgs/RtlImage";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../store/slices/authSlice";
import { toast } from "react-toastify";
import { notifications } from "../components/notifications";


export default function Alerts() {
  const [notificationTypes, setNotificationTypes] = useState([
    {id: 'order_confirmation', name: 'אישור הזמנה'},
    {id: 'draft_order_invoice', name: 'חשבונית להזמנה (טיוטה)'},
    {id: 'shipping_confirmation', name: 'אישור משלוח'},
    {id: 'ready_for_local_pickup', name: 'מוכן לאיסוף עצמי'},
    {id: 'picked_up_by_customer', name: 'נאסף על ידי הלקוח'},
    {id: 'order_out_for_local_delivery', name: 'יצא למסירה מקומית'},
    {id: 'order_locally_delivered', name: 'נמסר מקומית'},
    {id: 'order_missed_local_delivery', name: 'מסירה מקומית שנכשלה'},
    {id: 'new_gift_card', name: 'כרטיס מתנה חדש'},
    {id: 'order_invoice', name: 'חשבונית הזמנה'},
    {id: 'order_editted', name: 'עריכת הזמנה'},
    {id: 'order_cancelled', name: 'ביטול הזמנה'},
    {id: 'order_payment_receipt', name: 'קבלת תשלום להזמנה'},
    {id: 'order_refund', name: 'זיכוי הזמנה'},
    {id: 'payment_error', name: 'שגיאת תשלום'},
    {id: 'pending_payment_error', name: 'שגיאת תשלום בהמתנה'},
    {id: 'pending_payment_success', name: 'תשלום בהמתנה הושלם'},
    {id: 'shipping_update', name: 'עדכון משלוח'},
    {id: 'out_for_delivery', name: 'יצא למסירה'},
    {id: 'delivered', name: 'נמסר'},
    {id: 'return_created', name: 'החזרה נוצרה'},
    {id: 'order_level_return_label_created', name: 'תווית החזרה נוצרה (רמת הזמנה)'},
    {id: 'customer_account_invite', name: 'הזמנת חשבון לקוח'},
    {id: 'contact_customer', name: 'יצירת קשר עם הלקוח'},
  ]);
  

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Page >
          <Layout>
            <Layout.Section>
              <div>
                <AlertSection notificationTypes={notificationTypes} />
              </div>
            </Layout.Section>
          </Layout>
        </Page>
      </div>
    </div>
  );
}

const AlertSection = ({ notificationTypes }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);
  const [selectedNotificationType, setSelectedNotificationType] = useState(user?.selectedNotificationType || "");
  const [formData, setFormData] = useState({
    emailSubject: "",
    emailBody: "",
  });
  const [shop, setShop] = useState(user?.shop || "");
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  // Prefill subject/body from notifications array when notification type changes
  const handleNotificationTypeChange = (e) => {
    const selectedType = e.target.value;
    setSelectedNotificationType(selectedType);
    setIsSubmitSuccessful(false);

    // Find notification template by id
    const template = notifications.find((n) => n.id === selectedType);
    setFormData({
      emailSubject: template?.subject || "",
      emailBody: template?.body || "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const copyToClipboard = async () => {
    try {
      const textToCopy = formData.emailBody;
      await navigator.clipboard.writeText(textToCopy);
      toast.success("טקסט הועתק ללוח!");
    } catch (err) {
      toast.error('העתקת הטקסט נכשלה');
      console.error('העתקת הטקסט נכשלה: ', err);
    }
  };

  const navigateToNotificationManager = () => {
    const shopifyAdmin = "https://admin.shopify.com/store";
    const shopName = shop.replace(".myshopify.com", "");
    
    https: window.open(
      `${shopifyAdmin}/${shopName}/settings/notifications`,
      "_blank"
    );
  };

  //   dispatch = useDispatch();
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setIsLoading(true);
  //   try {
  //     const response = await fetch("/api/settings/update-notification", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ 
  //         notificationType: selectedNotificationType,
  //         ...formData
  //       }),
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to update notification');
  //     }

  //     const data = await response.json();
  //     dispatch(login({ user: data.user, subscription: data.subscription }));
  //     setIsSubmitSuccessful(true);
  //     toast.success('Notification template updated successfully');
      
  //   } catch (error) {
  //     console.error("Error updating notification:", error);
  //     toast.error(error.message || "Error updating notification");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  return (
    <section className="rtl-section">
      <div className="rtl-header">
        <h2 className="rtl-title">התראות</h2>
        <p className="rtl-description">
          התאימו את ההתראות שלכם כדי לעדכן את הלקוחות בכל שלב במסע שלהם.
        </p>
      </div>

      <div className="theme-selector">
        <div
          style={{
            background: "#021341",
            borderRadius: "10px",
            padding: "16px",
          }}
          className="my-4"
        >
          <div class="d-flex jcb aic">
            <div class="d-flex aic gap-2">
              <AlertIcon3 />
              <div>
                <p class="fs14 fw700" style={{ color: "#FBFBFB" }}>
                  לקוחות יקרים! הוספנו עבורכם התראות נוספות מתורגמות לעברית
                  לשימושכם 💙
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex jcb">
          <form>
            <p className="fw700 fs14">בחירת התראות:</p>
            <Input
              type="select"
              label="בחר סוג התראה והתאם אישית את תוכן ההודעה. בחר תבנית התראה."
              id="notification_type"
              name="notification_type"
              options={notificationTypes}
              placeholder="בחר נושא"
              value={selectedNotificationType}
              onChange={handleNotificationTypeChange}
            />

            <div className="mt-4">
              <p className="fw700 fs14">נושא המייל</p>
              <Input
                type="text"
                label="עדכן את נושא המייל"
                id="emailSubject"
                name="emailSubject"
                placeholder="נושא המייל..."
                value={formData.emailSubject}
                onChange={handleInputChange}
                style={{ width: "100%" }}
              />
            </div>

            <div className="mt-4">
              <p className="fw700 fs14">גוף המייל</p>
              <textarea
                name="emailBody"
                id="emailBody"
                value={formData.emailBody}
                onChange={handleInputChange}
                placeholder='הכנס את תוכן המייל או השתמש בכפתור "צור תבנית חדשה" ליצירת תבנית אוטומטית'
                className="form-control"
                rows="6"
                style={{ width: "100%" }}
                dir="rtl"
              />
            </div>

            <div className="d-flex gap-3 mt-4">
              {/* <Button loading={isLoading} type="submit">
                שמור
              </Button> */}
              <Button type="button" onClick={copyToClipboard}>
                העתקת טקסט
              </Button>
            </div>
            <div
              style={{
                background: "#021341",
                borderRadius: "10px",
                padding: "16px",
              }}
              className="my-4"
            >
              <div className="d-flex jcb aic">
                <div className="d-flex aic gap-2">
                  <AlertIcon3 />
                  <div>
                    <p className="fs14 fw700" style={{ color: "#FBFBFB", marginBottom: '50px' }}>
                      לאחר שערכתם את הטקסט בחלון למעלה, לחצו "העתקת טקסט" והכנסו
                      לניהול ההתראות, שם תדביקו את הטקסט:
                    </p>
                    <Button onClick={navigateToNotificationManager} style={{ padding: "10px 20px", borderRadius: "8px", marginTop: "200px", display: 'block', width: 'max-content' }}>
                      ניהול התראות
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="steps">
        <h4>שלבים:</h4>

        {[
          "שלב 1 - בחרו התראה מהרשימה.",
          "שלב 2 - שנו את גוף המייל.",
          'שלב 3 - לחצו "העתקת טקסט".',
          "שלב 4 - עברו למסך ניהול התראות.",
          "שלב 5 - מחקו את מה שיש שם, הדביקו את מה שהעתקתם.",
        ].map((item) => (
          <div
            className="d-flex aic gap-3 mb-2"
            style={{ justifyContent: "flex-start" }}
            key={item}
          >
            <CheckLightIcon />
            <p className="fs14" style={{ color: "#FBFBFB !important" }}>
              {item}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
