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
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">טוען...</span>
        </div>
        <p>טוען פרטי חנות...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "red" }}>
        <p>{error}</p>
        <p>אנא וודא שהקישור כולל את פרמטר החנות הנכון.</p>
      </div>
    );
  }

  return (
    <section style={{ maxWidth: "600px", margin: "0 auto", padding: "20px", direction: "rtl" }}>
      <h1 className="fs18 fw700" style={{ marginBottom: "20px" }}>ביטול עסקה</h1>
      
      {storeDetails && (
        <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
          <h2 className="fs16 fw700" style={{ marginBottom: "10px" }}>פרטי החנות</h2>
          <p className="fs14 fw500" style={{ margin: "5px 0" }}>שם החנות: {storeDetails.storeName}</p>
          <p className="fs14 fw500" style={{ margin: "5px 0" }}>אימייל: {storeDetails.email}</p>
          <p className="fs14 fw500" style={{ margin: "5px 0" }}>טלפון: {storeDetails.phone}</p>
          <p className="fs14 fw500" style={{ margin: "5px 0" }}>כתובת: {storeDetails.address}</p>
        </div>
      )}
      
      <p className="fs14 fw500" style={{ color: "#666", marginBottom: "20px" }}>
        מלאו את הפרטים בטופס הבא כדי להגיש בקשה לביטול עסקה.
      </p>
      
      <form onSubmit={handleSubmit}>
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
        
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="message" className="form-label fs14 fw700">
            הודעה
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            placeholder="הקלד כאן הודעה נוספת..."
            style={{ 
              width: "100%", 
              height: "150px", 
              resize: "vertical",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px"
            }}
          ></textarea>
        </div>
        
        <div className="mt-4">
          <Button
            type="submit"
            className="primary-button"
            disabled={isSubmitting}
            style={{
              minWidth: "120px",
              height: "45px",
              borderRadius: "8px",
              backgroundColor: "#25D366",
              border: "none",
              color: "#FFFFFF",
              fontSize: "16px",
              fontWeight: "500",
              padding: "0 20px"
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
      </form>
    </section>
  );
}
