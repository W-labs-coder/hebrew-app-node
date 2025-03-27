import React, { useState } from "react";
import { Layout, Page } from "@shopify/polaris";
import Sidebar from "../components/Sidebar";
import Input from "../components/form/Input";
import PaymentImage from "../components/svgs/PaymentImage";
import UploadIcon from "../components/svgs/UploadIcon";
import Button from "../components/form/Button";
import CheckLightIcon from "../components/svgs/CheckLightIcon";
import { toast } from "react-toastify";
import { login } from "../store/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { Form } from 'react-bootstrap';
import { Icon } from '@iconify/react';
import AmericanExpressIcon from "../components/svgs/AmericanExpressIcon";
import DinersIcon from "../components/svgs/DinersIcon";
import ApplePayIcon from "../components/svgs/ApplePayIcon";
import BitIcon from "../components/svgs/BitIcon";
import MasterCardIcon from "../components/svgs/MasterCardIcon";
import GooglePayIcon from "../components/svgs/GooglePayIcon";
import VisaIcon from "../components/svgs/VisaIcon";
import PaypalIcon from "../components/svgs/PaypalIcon";
import TruckDeliveryIcon from "../components/svgs/TruckDeliveryIcon";
import PackageIcon from "../components/svgs/PackageIcon";
import AirplaneIcon from "../components/svgs/AirplaneIcon";
import SendIcon from "../components/svgs/SendIcon";
import CalendarIcon from "../components/svgs/CalendarIcon";
import AppointmentIcon from "../components/svgs/AppointmentIcon";

export default function Payment() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Page >
          <Layout>
            <Layout.Section>
              <div>
                <PaymentSection />
              </div>
            </Layout.Section>
          </Layout>
        </Page>
      </div>
    </div>
  );
}

const PaymentSection = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);

  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch()

  const processors = [
    { name: "American Express", icon: <AmericanExpressIcon /> },
    { name: "Diners", icon: <DinersIcon /> },
    { name: "Apple Pay", icon: <ApplePayIcon /> },
    { name: "Bit", icon: <BitIcon /> },
    { name: "Isracard", icon: <MasterCardIcon /> }, // Using MasterCard as fallback
    { name: "Google Pay", icon: <GooglePayIcon /> },
    { name: "Visa", icon: <VisaIcon /> },
    { name: "Master Card", icon: <MasterCardIcon /> },
    { name: "Paypal", icon: <PaypalIcon /> },
  ];

  const features = [
    { name: "Delivery", icon: <TruckDeliveryIcon /> },
    { name: "Package", icon: <PackageIcon /> },
    { name: "Airplane", icon: <AirplaneIcon /> },
    { name: "Sent", icon: <SendIcon /> },
  ];

  const calendars = [
    { name: "Calendar", icon: <CalendarIcon /> },
    { name: "Appointment", icon: <AppointmentIcon /> },
  ];

  const shippings = [
    {
      name: "משלוח חינם מ-₪5",
      id: "משלוח חינם מ-₪5",
      value: "משלוח חינם מ-₪5",
    },
    {
      name: "משלוח חינם מ-₪10",
      id: "משלוח חינם מ-₪10",
      value: "משלוח חינם מ-₪10",
    },
    {
      name: "משלוח חינם מ-₪20",
      id: "משלוח חינם מ-₪20",
      value: "משלוח חינם מ-₪20",
    },
    {
      name: "משלוח חינם מ-₪25",
      id: "משלוח חינם מ-₪25",
      value: "משלוח חינם מ-₪25",
    },
    {
      name: "משלוח חינם מ-₪30",
      id: "משלוח חינם מ-₪30",
      value: "משלוח חינם מ-₪30",
    },
    {
      name: "משלוח חינם מ-₪35",
      id: "משלוח חינם מ-₪35",
      value: "משלוח חינם מ-₪35",
    },
    {
      name: "משלוח חינם מ-₪40",
      id: "משלוח חינם מ-₪40",
      value: "משלוח חינם מ-₪40",
    },
    { name: "Custom", id: "custom", value: "custom" },
  ];

  const [formData, setFormData] = useState({
    selectedProcessors: user?.selectedProcessors || [],
    customProcessor: user?.customProcessor || { name: "", icon: null },
    selectedFeatures: user?.selectedFeatures || [],
    shipping: user?.shipping || "",
    customShipping: user?.customShipping || "",
    warranty: user?.warranty || "",
    selectedCalendars: user?.selectedCalendars || [],
    paymentBackgroundColor: user?.paymentBackgroundColor || "transparent",
  });

  const [selectedBackground, setSelectedBackground] = useState(user?.paymentBackgroundColor || 'transparent');

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (type === "checkbox") {
      const list =
        name === "processor"
          ? "selectedProcessors"
          : name === "feature"
          ? "selectedFeatures"
          : "selectedCalendars";
      setFormData((prevState) => ({
        ...prevState,
        [list]: checked
          ? [...prevState[list], value]
          : prevState[list].filter((item) => item !== value),
      }));
    } else if (name === "customProcessorName") {
      setFormData((prevState) => ({
        ...prevState,
        customProcessor: { ...prevState.customProcessor, name: value },
      }));
    } else {
      setFormData((prevState) => ({ ...prevState, [name]: value }));
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData((prevState) => ({
        ...prevState,
        customProcessor: {
          ...prevState.customProcessor,
          icon: URL.createObjectURL(file),
        },
      }));
    }
  };

  const handleBackgroundChange = (e) => {
    setSelectedBackground(e.target.value);
    setFormData(prev => ({
      ...prev,
      paymentBackground: e.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setIsSubmitSuccessful(false);
    try {
      const response = await fetch("/api/settings/update-payment-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          paymentBackgroundColor: selectedBackground,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Network response was not ok");
      }

      const data = await response.json();
      dispatch(login({ user: data.user }));
      setIsSubmitSuccessful(true);
      toast.success("Payment methods added successfully");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Could not add payment method");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPaymentEditorUrl = () => {
    const shopifyAdmin = "https://admin.shopify.com/store";
    const themeIdMatch = user?.selectedTheme.match(/\/(\d+)$/);
    const themeId = themeIdMatch ? themeIdMatch[1] : "";
    return `${shopifyAdmin}/${user?.shop.replace(
      ".myshopify.com",
      ""
    )}/themes/${themeId}/editor?context=apps`;
  };


  return (
    <section>
      <div>
        <p className="fw700 fs18">משדרגים את הביטחון:חיזוק הביטחון ללקוחותיך</p>
        <p className="fs14 fw500" style={{ color: "#777" }}>
          בחר את שיטת התשלום המועדפת עליך לחוויית תשלום חלקה.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          className="d-flex flex-column jcs"
          style={{
            margin: "16px 0",
            border: "1px solid #C6C6C6",
            borderRadius: "16px",
            padding: "16px",
            gap: "16px",
            backgroundColor: "#FBFBFB",
          }}
        >
          <div
            style={{
              backgroundColor: "#FBFBFB",
              lineHeight: "21px",
              border: "1px solid #C6C6C6",
              borderRadius: "10px",
              padding: "16px",
            }}
            className="d-flex jcb ais"
          >
            <div>
              <div>
                <div className="d-flex flex-column justify-content-end align-items-start mb-2">
                  <p className="fs14 fw700">בחירת צבע רקע:</p>
                  <div className="background-options">
                    <div className="form-check rtl">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="transparent-background"
                        name="paymentBackgroundColor"
                        value="transparent"
                        checked={selectedBackground === 'transparent'}
                        onChange={(e) => {
                          setSelectedBackground(e.target.value);
                          setFormData(prev => ({
                            ...prev,
                            paymentBackgroundColor: e.target.value
                          }));
                        }}
                      />
                      <label className="form-check-label" htmlFor="transparent-background">
                        צבע רקע שקוף
                      </label>
                    </div>
                    <div className="form-check rtl">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="white-background"
                        name="paymentBackgroundColor"
                        value="white"
                        checked={selectedBackground === 'white'}
                        onChange={(e) => {
                          setSelectedBackground(e.target.value);
                          setFormData(prev => ({
                            ...prev,
                            paymentBackgroundColor: e.target.value
                          }));
                        }}
                      />
                      <label className="form-check-label" htmlFor="white-background">
                        צבע רקע לבן
                      </label>
                    </div>
                  </div>
                </div>
                <p className="fw700 fs14">בחירת אמצעי תשלום מותאם אישית:</p>
                <div>
                  <Input
                    type="text"
                    label="שם אמצעי התשלום:"
                    id="customProcessorName"
                    name="customProcessorName"
                    placeholder="הכנס שם..."
                    onChange={handleInputChange}
                    value={formData.customProcessor.name}
                  />

                  {formData.customProcessor.icon && (
                    <div style={{ marginTop: "16px" }}>
                      <p>תצוגה מקדימה:</p>
                      <img
                        src={formData.customProcessor.icon}
                        alt="Custom Processor Preview"
                        style={{
                          maxWidth: "100px",
                          maxHeight: "100px",
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                        }}
                      />
                      <p>{formData.customProcessor.name}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="fw700 fs14">בחירת אמצעי תשלום:</p>
                <div className="row">
                  {processors.map((processor) => (
                    <div className="col-3" key={processor.name}>
                      <label
                        className="fs14 fw500"
                        style={{ color: "#0D0D0D" }}
                      >
                        {processor.icon}
                        <div>
                          <input
                            type="checkbox"
                            name="processor"
                            value={processor.name}
                            checked={formData.selectedProcessors.includes(
                              processor.name
                            )}
                            onChange={handleInputChange}
                          />
                          <span className="me-2">{processor.name}</span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* <div style={{ marginTop: "16px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "220px",
                    height: "40px",
                    padding: "8px 24px",
                    gap: "10px",
                    borderRadius: "24px",
                    backgroundColor: "#021341",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: "700",
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                  <div className="d-flex gap-2 aic">
                    הוסף שיטת תשלום
                    <UploadIcon />
                  </div>
                </label>
              </div> */}
            </div>
            <div className="">
              <PaymentImage />
            </div>
          </div>
        </div>

        <div
          className="d-flex flex-column jcs"
          style={{
            margin: "16px 0",
            border: "1px solid #C6C6C6",
            borderRadius: "16px",
            padding: "16px",
            gap: "16px",
            backgroundColor: "#FBFBFB",
          }}
        >
          <div
            style={{
              backgroundColor: "#FBFBFB",
              lineHeight: "21px",
              border: "1px solid #C6C6C6",
              borderRadius: "10px",
              padding: "16px",
            }}
            className="d-flex jcb ais"
          >
            <div>
              <div>
                <p className="fw700 fs14">החזר כספי מובטח:</p>
                <p className="my-2 fs14">בחר כל סגנון סמל</p>

                <div className="row jcs w-100">
                  {features.map((feature) => (
                    <div className="col-3" key={feature.name}>
                      <label
                        className="fs14 fw500 d-flex gap-2"
                        style={{ color: "#0D0D0D" }}
                      >
                        <input
                          type="checkbox"
                          name="feature"
                          value={feature.name}
                          checked={formData.selectedFeatures.includes(
                            feature.name
                          )}
                          onChange={handleInputChange}
                        />
                        {feature.icon}
                      </label>
                    </div>
                  ))}
                </div>
                <div>
                  <Input
                    type="select"
                    label="בחר דרישות משלוח חינם:"
                    id="shipping"
                    name="shipping"
                    options={shippings}
                    placeholder="Free shipping from $5"
                    onChange={handleInputChange}
                    value={formData.shipping}
                  />

                  {formData.shipping === "custom" && (
                    <div style={{ marginTop: "16px" }}>
                      <label htmlFor="customShipping" className="fw700 fs14">
                        הכנס דרישה מותאמת אישית:
                      </label>
                      <input
                        type="text"
                        id="customShipping"
                        name="customShipping"
                        value={formData.customShipping}
                        placeholder="הכנס ערך מותאם אישית..."
                        onChange={handleInputChange}
                        style={{
                          width: "100%",
                          padding: "8px",
                          marginTop: "8px",
                          border: "1px solid #C6C6C6",
                          borderRadius: "8px",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5">
                <p className="fw700 fs14">משלוח חינם מ:</p>
                <p className="my-2 fs14">בחר כל סגנון סמל</p>

                <div className="row jcs w-100">
                  {calendars.map((calendar) => (
                    <div className="col-3" key={calendar.name}>
                      <label
                        className="fs14 fw500 d-flex gap-2"
                        style={{ color: "#0D0D0D" }}
                      >
                        <input
                          type="checkbox"
                          name="calendar"
                          value={calendar.name}
                          checked={formData.selectedCalendars.includes(
                            calendar.name
                          )}
                          onChange={handleInputChange}
                        />
                        {calendar.icon}
                      </label>
                    </div>
                  ))}
                </div>
                <div>
                  <Input
                    type="text"
                    label="כמה ימי אחריות יש?"
                    id="warranty"
                    name="warranty"
                    placeholder="הקלד מספר ימי אחריות להחזר כספי כאן..."
                    onChange={handleInputChange}
                    value={formData.warranty}
                  />

                  <Button
                    type="submit"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "שומר..." : "שמור"}
                  </Button>

                  {isSubmitSuccessful && (
                    <>
                      <div
                        className="success-message"
                        style={{
                          marginTop: "16px",
                          padding: "12px",
                          backgroundColor: "#e6f7e6",
                          color: "#2e7d32",
                          borderRadius: "4px",
                          textAlign: "center",
                        }}
                      >
                        הגדרות התשלום נשמרו בהצלחה!
                      </div>
                    </>
                  )}

                  {isSubmitSuccessful && (
                    <a
                      href={getPaymentEditorUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button bg-yellow"
                      style={{
                        display: "inline-block",
                        marginTop: "10px",
                        padding: "10px 20px",
                        color: "#0D0D0D",
                        textDecoration: "none",
                        borderRadius: "5px",
                        fontWeight: "bold",
                      }}
                    >
                      עבור לערכת הנושא
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="steps">
            <h4>הדרכה לשימוש במסך זה:</h4>

            {[
              "שלב 1 - בחרו את צבע הרקע של אמצעי התשלום.",
              "שלב 2 - רשמו את הטקסט שיופיע מעל אמצעי התשלום.",
              "שלב 3 - בחרו את אמצעי התשלום שתרצו שיופיעו באתר.",
              'שלב 4 - לחצו על כפתור "שמירה".',
              'שלב 5 - לחצו על כפתור "הגדרות האפליקציה בערכת הנושא".',
              'שלב 6 - וודאו שהאפליקציה מופעלת וש"Activate footer banners" מסומן כדי להפעיל את אמצעי התשלום בתחתית האתר.',
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
        </div>
      </form>
    </section>
  );
};
