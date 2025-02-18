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
import WhatsappIcon from "../components/svgs/WhatsAppIcon";
import WhatsappIconPreview from "../components/svgs/WhatsappIconPreview";

export default function Whatsapp() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Page >
          <Layout>
            <Layout.Section>
              <div>
                <WhatsappSettings />
              </div>
            </Layout.Section>
          </Layout>
        </Page>
      </div>
    </div>
  );
}

const WhatsappSettings = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const [selectedPosition, setSelectedPosition] = useState(user?.whatsappPosition || 'right');
  const [selectedStyle, setSelectedStyle] = useState(user?.whatsappStyle || 'text_and_icon');

  const [formData, setFormData] = useState({
    whatsappNumber: user?.whatsappNumber || '',
    buttonLabel: user?.buttonLabel || '',
    whatsappPosition: user?.whatsappPosition || 'right',
    whatsappStyle: user?.whatsappStyle || 'text_and_icon',
    whatsappText: user?.whatsappText || '',
    buttonBgColor: user?.buttonBgColor || '#25D366',
    buttonTextColor: user?.buttonTextColor || '#FFFFFF',
    buttonIconColor: user?.buttonIconColor || '#FFFFFF',
    includeProductDetails: user?.includeProductDetails || false,
  });

  const [welcomeSettings, setWelcomeSettings] = useState({
    enableWelcomeMessage: user?.enableWelcomeMessage || false,
    welcomeMessage: user?.welcomeMessage || '',
    messageFrequency: user?.messageFrequency || 1,
    messageDelay: user?.messageDelay || 0,
  });

  const validateForm = () => {
    if (!formData.whatsappNumber) {
      toast.error('WhatsApp number is required');
      return false;
    }
  
    const phoneNumberRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneNumberRegex.test(formData.whatsappNumber.replace(/\s+/g, ''))) {
      toast.error('Invalid WhatsApp number format. Please use international format (e.g. +972501234567)');
      return false;
    }
  
    return true;
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
  
    setIsSubmitting(true);
    setIsSubmitSuccessful(false);
    
    try {
      const response = await fetch("/api/settings/update-whatsapp-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          ...welcomeSettings
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Network response was not ok');
      }

      dispatch(login({user : data.user}));
      setIsSubmitSuccessful(true);
      toast.success('WhatsApp settings updated successfully');
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(error.message || "Could not update WhatsApp settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppClick = () => {
    try {
      const phoneNumber = formData.whatsappNumber.replace(/[^0-9]/g, '');
      const message = encodeURIComponent(formData.whatsappText || '');
      
      // Use direct WhatsApp link format instead of API
      const url = `https://wa.me/${phoneNumber}${message ? `?text=${message}` : ''}`;
      
      // Open in new tab
      window.open(url, '_blank');
    } catch (error) {
      console.error('WhatsApp redirect error:', error);
      toast.error('Could not open WhatsApp. Please check your phone number format.');
    }
  };

  const getWhatsAppEditorUrl = () => {
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
        <p className="fw700 fs18">אינטגרציית WhatsApp</p>
        <p className="fs14 fw500" style={{ color: "#777" }}>
          שפר את המעורבות של הלקוחות עם הודעת ווטסאפ מותאמת אישית למבקרים בחנות
          שלך.
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
            className="d-flex jcb "
          >
            <div>
              <div>
                <div className="d-flex flex-column justify-content-end align-items-start mb-2">
                  <div>
                    <p className="fw700 fs14">הגדרת WhatsApp</p>
                    <p className="fs14 fw500" style={{ color: "#777" }}>
                      התאימו את האינטגרציה של WhatsApp עם ההגדרות הבאות:
                    </p>
                  </div>

                  <div style={{ width: "100%" }} className="rtl">
                    <Input
                      type="tel"
                      label="מספר טלפון WhatsApp"
                      id="whatsappNumber"
                      name="whatsappNumber"
                      placeholder="+972501234567"
                      value={formData.whatsappNumber}
                      onChange={handleInputChange}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div className="my-2">
                    <p className="fw700 fs14">מיקום האייקונים:</p>
                    <div className=" d-flex">
                      <div className="form-check rtl ">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="position-right"
                          name="whatsappPosition"
                          
                          value="right"
                          checked={selectedPosition === "right"}
                          onChange={(e) => {
                            setSelectedPosition(e.target.value);
                            setFormData((prev) => ({
                              ...prev,
                              whatsappPosition: e.target.value,
                            }));
                          }}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="position-right"
                        >
                          ימין
                        </label>
                      </div>
                      <div className="form-check rtl">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="position-left"
                          name="whatsappPosition"
                          value="left"
                          checked={selectedPosition === "left"}
                          onChange={(e) => {
                            setSelectedPosition(e.target.value);
                            setFormData((prev) => ({
                              ...prev,
                              whatsappPosition: e.target.value,
                            }));
                          }}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="position-left"
                        >
                          שמאל
                        </label>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="fw700 fs14"> התאמת המראה:</p>
                    <div className=" d-flex">
                      <div className="form-check rtl ">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="style-text-icon"
                          name="whatsappStyle"
                          value="text_and_icon"
                          checked={selectedStyle === "text_and_icon"}
                          onChange={(e) => {
                            setSelectedStyle(e.target.value);
                            setFormData((prev) => ({
                              ...prev,
                              whatsappStyle: e.target.value,
                            }));
                          }}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="style-text-icon"
                        >
                          כפתור עם טקסט ואייקון
                        </label>
                      </div>
                      <div className="form-check rtl">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="style-icon"
                          name="whatsappStyle"
                          value="icon"
                          checked={selectedStyle === "icon"}
                          onChange={(e) => {
                            setSelectedStyle(e.target.value);
                            setFormData((prev) => ({
                              ...prev,
                              whatsappStyle: e.target.value,
                            }));
                          }}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="style-icon"
                        >
                          כפתור עם אייקון
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="color-pickers-container mt-4">
                  <p className="fw700 fs14 mb-3">התאמת צבעים:</p>
                  <div className="d-flex gap-2">
                    <div className="color-picker-group rtl">
                      <label
                        htmlFor="buttonBgColor"
                        className="form-label fs14 mb-2"
                      >
                        רקע כפתור
                      </label>
                      <div className="color-picker-wrapper">
                        <span className="color-value">
                          {formData.buttonBgColor.toUpperCase()}
                        </span>
                        <input
                          type="color"
                          className="form-control form-control-color"
                          id="buttonBgColor"
                          name="buttonBgColor"
                          value={formData.buttonBgColor}
                          onChange={handleInputChange}
                          title="בחר צבע רקע"
                        />
                      </div>
                    </div>

                    <div className="color-picker-group rtl">
                      <label
                        htmlFor="buttonTextColor"
                        className="form-label fs14 mb-2"
                      >
                        צבע טקסט הכפתור
                      </label>
                      <div className="color-picker-wrapper">
                        <span className="color-value">
                          {formData.buttonTextColor.toUpperCase()}
                        </span>
                        <input
                          type="color"
                          className="form-control form-control-color"
                          id="buttonTextColor"
                          name="buttonTextColor"
                          value={formData.buttonTextColor}
                          onChange={handleInputChange}
                          title="בחר צבע טקסט"
                        />
                      </div>
                    </div>

                    <div className="color-picker-group rtl">
                      <label
                        htmlFor="buttonIconColor"
                        className="form-label fs14 mb-2"
                      >
                        צבע אייקון הכפתור
                      </label>
                      <div className="color-picker-wrapper">
                        <span className="color-value">
                          {formData.buttonIconColor.toUpperCase()}
                        </span>
                        <input
                          type="color"
                          className="form-control form-control-color"
                          id="buttonIconColor"
                          name="buttonIconColor"
                          value={formData.buttonIconColor}
                          onChange={handleInputChange}
                          title="בחר צבע אייקון"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rtl">
                  <Input
                    type="text"
                    label="תווית כפתור"
                    id="buttonLabel"
                    name="buttonLabel"
                    placeholder="צור קשר"
                    value={formData.buttonLabel}
                    onChange={handleInputChange}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  {/* add a checkbox with this label כלול פרטי מוצר בתחילת הצ'אט עם הלקוח */}
                </div>
                <div className="rtl mt-3">
                  <div className="form-check custom-checkbox">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="includeProductDetails"
                      name="includeProductDetails"
                      checked={formData.includeProductDetails}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          includeProductDetails: e.target.checked,
                        }));
                      }}
                    />
                    <label
                      className="form-check-label fs14"
                      htmlFor="includeProductDetails"
                    >
                      כלול פרטי מוצר בתחילת הצ'אט עם הלקוח
                    </label>
                  </div>
                </div>
                <div className="mt-4 d-flex justify-content-start">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="primary-button"
                    style={{
                      minWidth: "120px",
                      height: "40px",
                      borderRadius: "8px",
                      backgroundColor: "#25D366",
                      border: "none",
                      color: "#FFFFFF",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    {isSubmitting ? (
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        שומר...
                      </div>
                    ) : (
                      "שמור"
                    )}
                  </Button>
                </div>

                {isSubmitSuccessful && (
                  <div className="mt-3">
                    <div
                      className="text-center p-3 mb-3"
                      style={{
                        backgroundColor: "#E8F5E9",
                        borderRadius: "8px",
                        color: "#2E7D32",
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <CheckLightIcon />
                        <span>ההגדרות נשמרו בהצלחה</span>
                      </div>
                    </div>

                    <a
                      href={getWhatsAppEditorUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="d-block text-center mt-3"
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#FFC107",
                        color: "#0D0D0D",
                        textDecoration: "none",
                        borderRadius: "5px",
                        fontWeight: "bold",
                        width: "fit-content",
                        margin: "0 auto",
                      }}
                    >
                      עבור לערכת הנושא
                    </a>
                  </div>
                )}
              </div>
            </div>
            {/* Preview */}
            <div>
              <p className="fw700 fs14">תצוגה מקדימה חיה</p>
              <div className="preview-container">
                <div className="preview-frame">
                  <div className="preview-content">
                    <div
                      className={`whatsapp-button ${selectedStyle}`}
                      style={{
                        backgroundColor: formData.buttonBgColor,
                        position: "absolute",
                        [selectedPosition]: "20px",
                        bottom: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding:
                          selectedStyle === "text_and_icon"
                            ? "8px 16px"
                            : "8px",
                        borderRadius:
                          selectedStyle === "text_and_icon" ? "8px" : "50%",
                        minWidth:
                          selectedStyle === "text_and_icon" ? "160px" : "40px",
                        height:
                          selectedStyle === "text_and_icon" ? "auto" : "40px",
                        cursor: "pointer",
                        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                        transition: "all 0.3s ease",
                        justifyContent: "center",
                      }}
                      onClick={handleWhatsAppClick}
                    >
                      <WhatsappIconPreview
                        color={formData.buttonIconColor}
                        style={{
                          width:
                            selectedStyle === "text_and_icon" ? "24px" : "32px",
                          height:
                            selectedStyle === "text_and_icon" ? "24px" : "32px",
                        }}
                      />
                      {selectedStyle === "text_and_icon" && (
                        <span
                          style={{
                            color: formData.buttonTextColor,
                            fontSize: "14px",
                            fontWeight: "500",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formData.buttonLabel || "צור קשר"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="preview-color-row">
                    <div
                      className="color-square"
                      style={{ backgroundColor: formData.buttonBgColor }}
                    />
                    <span>:צבע רקע</span>
                  </div>
                  <div className="preview-color-row">
                    <div
                      className="color-square"
                      style={{
                        backgroundColor: formData.buttonIconColor,
                        border: "1px solid #C6C6C6",
                      }}
                    />
                    <span>:צבע האייקון</span>
                  </div>
                  {selectedStyle === "text_and_icon" && (
                    <div className="preview-color-row bottom">
                      <div
                        className="color-square"
                        style={{
                          backgroundColor: formData.buttonTextColor,
                          border: "1px solid #C6C6C6",
                        }}
                      />
                      <span>:צבע הטקסט</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* End preview */}
          </div>
        </div>
        <div
          
          style={{
            margin: "16px 0",
            border: "1px solid #C6C6C6",
            borderRadius: "16px",
            padding: "16px",
            backgroundColor: "#FBFBFB",
          }}
        >
          <div className="d-flex jcb"
            style={{
              backgroundColor: "#FBFBFB",
              width:'100%',
              border: "1px solid #C6C6C6",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            {/* Left side - Form */}
            <div style={{ width: "60%" }}>
              <div className="mb-4">
                <p className="fw700 fs18">ברכות קבלה</p>
                <p className="fs14 fw500" style={{ color: "#777" }}>
                  הגבירו מעורבות עם ברכה מותאמת אישית למבקרים חדשים.
                </p>
              </div>

              <div className="rtl">
                <div className="mb-4">
                  <Form.Check
                    type="switch"
                    id="enableWelcomeMessage"
                    checked={welcomeSettings.enableWelcomeMessage}
                    onChange={(e) => {
                      setWelcomeSettings((prev) => ({
                        ...prev,
                        enableWelcomeMessage: e.target.checked,
                      }));
                    }}
                    label="אפשר הודעת ברוך הבא"
                    className="fs14"
                  />
                </div>

                <div className="mb-4">
                  <Input
                    type="textarea"
                    label="תוכן ההודעה"
                    id="welcomeMessage"
                    placeholder="היי! איך אפשר לעזור היום?"
                    name="welcomeMessage"
                    value={welcomeSettings.welcomeMessage}
                    onChange={(e) => {
                      setWelcomeSettings((prev) => ({
                        ...prev,
                        welcomeMessage: e.target.value,
                      }));
                    }}
                    disabled={!welcomeSettings.enableWelcomeMessage}
                    style={{
                      minHeight: "100px",
                      resize: "vertical",
                      direction: "rtl",
                    }}
                  />
                </div>

                <div className="d mb-4">
                  <div >
                    <Input
                      type="number"
                      label="תדירות הודעת ברוך הבא לפי ימים"
                      id="messageFrequency"
                      name="messageFrequency"
                      value={welcomeSettings.messageFrequency}
                      min="1"
                      onChange={(e) => {
                        setWelcomeSettings((prev) => ({
                          ...prev,
                          messageFrequency: parseInt(e.target.value) || 1,
                        }));
                      }}
                      disabled={!welcomeSettings.enableWelcomeMessage}
                    />
                  </div>
                  <div >
                    <Input
                      type="number"
                      label="עיכוב הודעה (בשניות)"
                      id="messageDelay"
                      name="messageDelay"
                      value={welcomeSettings.messageDelay}
                      min="0"
                      onChange={(e) => {
                        setWelcomeSettings((prev) => ({
                          ...prev,
                          messageDelay: parseInt(e.target.value) || 0,
                        }));
                      }}
                      disabled={!welcomeSettings.enableWelcomeMessage}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="primary-button"
                    style={{
                      minWidth: "120px",
                      height: "40px",
                      borderRadius: "8px",
                      backgroundColor: "#25D366",
                      border: "none",
                      color: "#FFFFFF",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    {isSubmitting ? (
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        שומר...
                      </div>
                    ) : (
                      "שמור"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right side - Preview */}
            <div>
              <p className="fw700 fs14 mb-2">תצוגה מקדימה חיה</p>
              <div className="preview-container">
                <div className="preview-frame">
                  <div
                    className="preview-content"
                    style={{
                      position: "relative",
                      height: "100px",
                      backgroundColor: "#FBFBFB",
                      border: "1px solid #C6C6C6",
                      borderRadius: "10px 10px 0 0",
                      padding: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row-reverse",
                        alignItems: "center",
                        justifyContent:'space-between',
                        backgroundColor: "#05B457",
                        padding: "8px 8px 8px 58px",
                        borderRadius: "10px",
                        width: "233px",
                      }}
                    >
                      <span
                        style={{
                          color: "#FFFFFF",
                          fontSize: "12px",
                          fontWeight: "500",
                          flexGrow: 1,
                          textAlign: "right",
                        }}
                      >
                        {welcomeSettings.welcomeMessage ||
                          "היי! איך אפשר לעזור היום?"}
                      </span>
                      <WhatsappIconPreview color="#FFFFFF" />
                    </div>
                  </div>
                  <div className="preview-color-row">
                    <span>:צבע רקע</span>
                    <div
                      className="color-square"
                      style={{ backgroundColor: "#05B457" }}
                    />
                  </div>
                  <div
                    className="preview-color-row"
                    style={{
                      borderRadius: "0 0 10px 10px",
                    }}
                  >
                    <span>:צבע האייקון</span>
                    <div
                      className="color-square"
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #C6C6C6",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="steps mt-4">
          <h4>הדרכה לשימוש במסך זה:</h4>
          {[
            "שלב 1 - הזינו את מספר הווטסאפ שלכם.",
            "שלב 2 - בחרו את מיקום כפתור הווטסאפ (ימין/שמאל).",
            "שלב 3 - בחרו את סגנון הכפתור (טקסט + אייקון / אייקון בלבד).",
            "שלב 4 - התאימו את צבעי הכפתור לפי העיצוב שלכם.",
            'שלב 5 - לחצו על כפתור "שמירה".',
            'שלב 6 - לחצו על "עבור לערכת הנושא" כדי להפעיל את כפתור הווטסאפ באתר.',
            'שלב 7 - וודאו שהאפשרות "Enable WhatsApp Button" מסומנת בערכת הנושא.',
          ].map((item) => (
            <div
              className="d-flex aic gap-3 mb-2"
              style={{ justifyContent: "flex-start" }}
              key={item}
            >
              <CheckLightIcon />
              <p className="fs14">{item}</p>
            </div>
          ))}
        </div>
      </form>
    </section>
  );
};
