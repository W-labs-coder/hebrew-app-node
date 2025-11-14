import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Input from "../components/form/Input";
import Button from "../components/form/Button";

export default function OrderCancellation() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    orderNumber: "",
    message: "",
    shop: ""
  });

  const [storeDetails, setStoreDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Extract shop from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get('shop');
    
    if (shopParam) {
      setFormData(prev => ({ ...prev, shop: shopParam }));
      
      // Fetch store details with the shop parameter
      fetchStoreDetails(shopParam);
    } else {
      setIsLoading(false);
      setError("חסר מידע על החנות. נא לגשת לעמוד דרך אתר החנות.");
      console.error("No shop parameter found in URL");
    }
  }, []);

  const fetchStoreDetails = async (shop) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/store-details?shop=${encodeURIComponent(shop)}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch store details");
      }
      
      const data = await response.json();
      setStoreDetails(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching store details:", error);
      setError("שגיאה בטעינת פרטי החנות");
      setIsLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.shop) {
      toast.error("חסר מידע על החנות. נא לרענן את העמוד ולנסות שוב.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/order-cancellation/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "שליחת בקשת הביטול נכשלה");
      }

      toast.success("בקשת הביטול נשלחה בהצלחה!");
      setFormData(prev => ({
        ...prev,
        fullName: "",
        email: "",
        phone: "",
        orderNumber: "",
        message: "",
        // Keep the shop value
      }));
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "שגיאה בשליחת הבקשה");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="rtl-section order-cancel-page">
        <div className="container-narrow" style={{ textAlign: "center", padding: "20px" }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">טוען...</span>
          </div>
          <p className="fs14 fw500" style={{ marginTop: 12 }}>טוען פרטי חנות...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rtl-section order-cancel-page">
      <div className="container-narrow">
        {error && (
          <div className="settings-card" style={{ marginBottom: 16 }}>
            <div className="card-body">
              <p className="fs14 fw700" style={{ color: "#CE2C60", margin: 0 }}>{error}</p>
              <p className="fs14" style={{ color: "#777", marginTop: 8 }}>אנא וודאו שהקישור כולל את פרמטר החנות הנכון.</p>
            </div>
          </div>
        )}

        <div className="rtl-header">
          <h2 className="rtl-title">ביטול עסקה</h2>
          <p className="rtl-description">מלאו את הפרטים כדי להגיש בקשה לביטול עסקה. נעדכן אתכם לאחר הטיפול בבקשה.</p>
        </div>

        {storeDetails && (
          <div className="settings-card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <p className="fw700 fs14" style={{ margin: 0 }}>פרטי החנות</p>
            </div>
            <div className="card-body">
              <div className="details-grid">
                <div className="label fs14 fw700" style={{ color: '#777' }}>שם החנות</div>
                <div className="fs14 fw500">{storeDetails.storeName}</div>
                <div className="label fs14 fw700" style={{ color: '#777' }}>אימייל</div>
                <div className="fs14 fw500">{storeDetails.email}</div>
                <div className="label fs14 fw700" style={{ color: '#777' }}>טלפון</div>
                <div className="fs14 fw500">{storeDetails.phone}</div>
                <div className="label fs14 fw700" style={{ color: '#777' }}>כתובת</div>
                <div className="fs14 fw500">{storeDetails.address}</div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="settings-card">
          <div className="card-header">
            <p className="fw700 fs14" style={{ margin: 0 }}>טופס בקשה לביטול עסקה</p>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <Input
                type="text"
                label="שם מלא"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="הקלד את שמך המלא כאן..."
                required
              />

              <Input
                type="email"
                label="דואר אלקטרוני"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="הקלד את כתובת האימייל שלך כאן..."
                required
              />

              <Input
                type="text"
                label="מספר טלפון"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="הקלד את מספר הטלפון שלך כאן..."
                required
              />

              <Input
                type="text"
                label="מספר הזמנה"
                id="orderNumber"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleInputChange}
                placeholder="הקלד את מספר ההזמנה שלך כאן..."
                required
              />

              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="message" className="form-label fs14 fw700">הודעה</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="הקלד כאן הודעה נוספת..."
                  className="form-textarea"
                  dir="rtl"
                  style={{ minHeight: 120 }}
                />
              </div>
            </div>

            <div className="mt-4">
              <Button
                type="submit"
                className="primary-button"
                disabled={isSubmitting}
                style={{
                  minWidth: "140px",
                  height: "44px",
                  borderRadius: "8px",
                  backgroundColor: "#25D366",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {isSubmitting ? (
                  <div className="d-flex align-items-center gap-2 justify-content-center">
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>שולח...</span>
                  </div>
                ) : (
                  "שלח בקשה"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
