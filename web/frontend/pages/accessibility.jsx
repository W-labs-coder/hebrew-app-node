import React, { useState, useEffect } from "react";
import { Layout, Page } from "@shopify/polaris";
import Sidebar from "../components/Sidebar";
import Input from "../components/form/Input";
import Button from "../components/form/Button";
import CheckLightIcon from "../components/svgs/CheckLightIcon";
import { toast } from "react-toastify";
import { login } from "../store/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import AccessibilityIconPreview from "../components/svgs/AccessibilityIconPreview";
import AlertIcon3 from "../components/svgs/AlertIcon3";

export default function Accessibility() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Page>
          <Layout>
            <Layout.Section>
              <div>
                <AccessibilitySettings />
              </div>
            </Layout.Section>
          </Layout>
        </Page>
      </div>
    </div>
  );
}

const AccessibilitySettings = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    iconLocation: user?.iconLocation || 'bottom_right',
    iconShape: user?.iconShape || 'rounded',
    iconSize: user?.iconSize || 'medium',
    iconType: user?.iconType || 'default',
    helpTitle: user?.helpTitle || 'כלי נגישות',
    helpText: user?.helpText || '',
    ownerEmail: user?.ownerEmail || '',
    leftIconSpacing: user?.leftIconSpacing || 20,
    topBottomSpacing: user?.topBottomSpacing || 20,
    zIndex: user?.zIndex || 999,
    accessibilityButtonBgColor: user?.accessibilityButtonBgColor || "#25D366",
    accessibilityButtonTextColor: user?.accessibilityButtonTextColor || "#FFFFFF",
    accessibilityButtonIconColor: user?.accessibilityButtonIconColor || "#FFFFFF",
  });



  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({ 
      ...prevState, 
      [name]: value 
    }));
    
    // Update selectedIconLocation if iconLocation changes
    if (name === 'iconLocation') {
      setSelectedIconLocation(value);
    }
  };

  // Add this validation function inside AccessibilitySettings
  const validateForm = () => {
    // List all required fields
    const requiredFields = [
      "iconLocation",
      "iconShape",
      "iconSize",
      "helpTitle",
      "helpText",
      "ownerEmail",
      "leftIconSpacing",
      "topBottomSpacing",
      "zIndex",
      "accessibilityButtonBgColor",
      "accessibilityButtonTextColor",
      "accessibilityButtonIconColor",
    ];
    for (const field of requiredFields) {
      if (
        formData[field] === undefined ||
        formData[field] === null ||
        formData[field] === "" ||
        (typeof formData[field] === "string" && formData[field].trim() === "")
      ) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate all fields before submitting
    if (!validateForm()) {
      toast.error("אנא מלאו את כל השדות הנדרשים לפני שמירה.");
      return;
    }

    setIsSubmitting(true);
    setIsSubmitSuccessful(false);

    try {
      // Combine formData and welcomeSettings
      const dataToSend = {
        ...formData,
      };

      const response = await fetch(
        "/api/settings/update-accessibility-settings", // Ensure this matches your backend URL and port
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
          credentials: "include",
          body: JSON.stringify(dataToSend),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "שמירת ההגדרות נכשלה"
        );
      }

      const data = await response.json();

      // Update Redux store with new user data
      if (data.user) {
        dispatch(login({ user: data.user, subscription:data.subscription }));
      }

      setIsSubmitSuccessful(true);
      toast.success("ההגדרות נשמרו בהצלחה");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "שמירת ההגדרות נכשלה");

      // Handle session expiration
      if (
        error.message.includes("Unauthorized") ||
        error.message.includes("session")
      ) {
        window.location.href = "/auth";
        return;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppClick = (contactPhone = formData.whatsappNumber) => {
    try {
      const phoneNumber = contactPhone.replace(/[^0-9]/g, "");
      let message = "";

      // Add default message if enabled
      if (formData.enableDefaultMessage && formData.defaultMessage) {
        message = formData.defaultMessage;
      }

      // Include product details if option is enabled and we're on a product page
      if (formData.includeProductDetails) {
        // You might want to get this from the page context
        const productDetails = window.location.pathname.includes("/products/")
          ? `\nProduct: ${window.location.pathname.split("/products/")[1]}`
          : "";
        message += productDetails;
      }

      // Create WhatsApp URL
      const url = `https://wa.me/${phoneNumber}${
        message ? `?text=${encodeURIComponent(message)}` : ""
      }`;

      // Open WhatsApp in new tab
      window.open(url, "_blank");
    } catch (error) {
      console.error("WhatsApp redirect error:", error);
      toast.error("לא ניתן לפתוח WhatsApp. בדקו את פורמט מספר הטלפון.");
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


  const [iconLocation, setIconLocation] = useState([
    { id: "top_left", name: "שמאל למעלה" },
    { id: "top_right", name: "למעלה מימין" },
    {id: 'bottom_left', name: "שמאל למטה"},
    {id: 'bottom_right', name: "ימין למטה"}
  ]);
  const [iconShape, setIconShape] = useState([
    { id: "rounded", name: "מְעוּגָל" },
    { id: "square", name: "מְרוּבָּע" },
  ]);
  const [iconSize, setIconSize] = useState([
    { id: "small", name: "קָטָן" },
    { id: "medium", name: "בֵּינוֹנִי" },
    { id: "large", name: "גָדוֹל" },
  ]);

  const iconTypes = [
    { id: "default", name: "ברירת מחדל" },
    { id: "modern", name: "מודרני" },
    { id: "classic", name: "קלאסי" },
  ];

  const [selectedIconLocation, setSelectedIconLocation] = useState('bottom_right')

  const handleIconLocationChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setSelectedIconLocation(value);
  }

  const getIconPosition = (location) => {
    switch (location) {
      case 'top_left':
        return { top: '20px', left: formData.leftIconSpacing + 'px' };
      case 'top_right':
        return { top: '20px', right: formData.leftIconSpacing + 'px' };
      case 'bottom_left':
        return { bottom: '20px', left: formData.leftIconSpacing + 'px' };
      case 'bottom_right':
      default:
        return { bottom: '20px', right: formData.leftIconSpacing + 'px' };
    }
  };

  const getIconSize = (size) => {
    switch (size) {
      case 'small': return { width: '32px', height: '32px' };
      case 'large': return { width: '64px', height: '64px' };
      case 'medium':
      default:
        return { width: '48px', height: '48px' };
    }
  };

  // Replace the preview section with this updated version
  const renderPreview = () => (
    <>
      <div className="preview-container">
        <div
          className="preview-frame"
          style={{
            position: "relative",
            width: "100%",
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#fff",
            overflow: "hidden",
          }}
        >
          <div className="preview-content">
            <div
              className={`accessibility-button `}
              style={{
                backgroundColor: formData.accessibilityButtonBgColor,
                position: "absolute",
                ...getIconPosition(formData.iconLocation),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px",
                borderRadius: formData.iconShape === "rounded" ? "100%" : "8px",
                cursor: "pointer",
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                transition: "all 0.3s ease",
                zIndex: formData.zIndex || 999,
                ...getIconSize(formData.iconSize),
              }}
            >
              <AccessibilityIconPreview
                color={formData.accessibilityButtonIconColor}
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />
              <div
                className="help-title"
                style={{
                  position: "absolute",
                  bottom: "-25px",
                  right: "50%",
                  transform: "translateX(50%)",
                  whiteSpace: "nowrap",
                  fontSize: "12px",
                  color: "#000",
                  opacity: 0,
                  transition: "opacity 0.3s",
                }}
              >
                {formData.helpTitle || "כלי נגישות"}
              </div>
            </div>
          </div>
        </div>
        <div className="preview-info" style={{ marginTop: "20px" }}>
          <div className="preview-color-row">
            <div
              className="color-square"
              style={{
                backgroundColor: formData.accessibilityButtonBgColor,
                width: "20px",
                height: "20px",
                borderRadius: "4px",
                marginRight: "8px",
              }}
            />
            <span>:צבע רקע</span>
          </div>
          <div className="preview-color-row" style={{ marginTop: "8px" }}>
            <div
              className="color-square"
              style={{
                backgroundColor: formData.accessibilityButtonIconColor,
                width: "20px",
                height: "20px",
                borderRadius: "4px",
                border: "1px solid #C6C6C6",
                marginRight: "8px",
              }}
            />
            <span>:צבע האייקון</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .accessibility-button:hover .help-title {
          opacity: 1;
        }
      `}</style>
    </>
  );

  return (
    <section className="rtl-section accessibility-page">
      <div className="rtl-header">
        <h2 className="rtl-title">נגישות</h2>
        <p className="rtl-description">
          שפר את הנגישות של החנות שלך כדי ליצור חוויה מכילה עבור כל המשתמשים.
        </p>
      </div>

      <div className="page-grid">
        {/* Left: Settings Card */}
        <form onSubmit={handleSubmit} className="settings-card">
          <div className="card-body">
            {/* Note Banner */}
            <div
              style={{
                background: "#021341",
                borderRadius: "10px",
                padding: "16px",
                margin: "8px 0 20px",
              }}
            >
              <div className="d-flex jcb aic">
                <div className="d-flex aic gap-2">
                  <AlertIcon3 />
                  <div>
                    <p className="fs14 fw700" style={{ color: "#FBFBFB" }}>
                      שימו לב: האפליקציה בעברית אינה מתחייבת לעמוד בתקן כלשהו.
                      היא משמשת כלי לשיפור נגישות האתר וליצירת הצהרת נגישות
                      המבוססת על תבנית.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="form-grid">
              <Input
                type="select"
                label="מיקום האייקון:"
                id="iconLocation"
                name="iconLocation"
                options={iconLocation}
                value={formData.iconLocation}
                onChange={handleInputChange}
              />
              <Input
                type="select"
                label="צורת האייקון:"
                id="iconShape"
                name="iconShape"
                options={iconShape}
                value={formData.iconShape}
                onChange={handleInputChange}
              />

              <Input
                type="select"
                label="גודל האייקון:"
                id="iconSize"
                name="iconSize"
                options={iconSize}
                value={formData.iconSize}
                onChange={handleInputChange}
              />
              <Input
                type="select"
                label="סוג האייקון:"
                id="iconType"
                name="iconType"
                options={iconTypes}
                value={formData.iconType}
                onChange={handleInputChange}
              />

              <Input
                type="number"
                label="ריווח האייקון ימין-שמאל (בפיקסלים):"
                id="leftIconSpacing"
                name="leftIconSpacing"
                value={formData.leftIconSpacing}
                onChange={handleInputChange}
              />
              <Input
                type="number"
                label="ריווח האייקון למעלה-למטה (בפיקסלים):"
                id="topBottomSpacing"
                name="topBottomSpacing"
                value={formData.topBottomSpacing}
                onChange={handleInputChange}
              />

              <Input
                type="text"
                label="כותרת עזרה (מופיעה בעת מעבר עכבר):"
                id="helpTitle"
                name="helpTitle"
                value={formData.helpTitle}
                onChange={handleInputChange}
                placeholder="כלי נגישות"
              />
              <Input
                type="email"
                label="דואר אלקטרוני של בעל האתר:"
                id="ownerEmail"
                name="ownerEmail"
                value={formData.ownerEmail}
                onChange={handleInputChange}
                placeholder="הקלד את האימייל שלך כאן..."
              />

              <div style={{ gridColumn: "1 / -1" }}>
                <p className="fw500 fs14">טקסט הצהרת נגישות:</p>
                <textarea
                  id="helpText"
                  name="helpText"
                  value={formData.helpText}
                  onChange={handleInputChange}
                  placeholder="הזן את הצהרת הנגישות כאן..."
                  style={{
                    minHeight: "100px",
                    resize: "vertical",
                    direction: "rtl",
                    width: "100%",
                  }}
                  dir="rtl"
                ></textarea>
              </div>

              <Input
                type="number"
                label="רמת שכבה (z-Index):"
                id="zIndex"
                name="zIndex"
                value={formData.zIndex}
                onChange={handleInputChange}
              />
            </div>

            {/* Colors */}
            <div className="color-pickers-container mt-4">
              <p className="fw700 fs14 mb-3">התאמת צבעים:</p>
              <div className="d-flex gap-1 flex-wrap">
                <div className="color-picker-group rtl">
                  <label
                    htmlFor="accessibilityButtonBgColor"
                    className="form-label fs14 mb-2"
                  >
                    רקע כפתור
                  </label>
                  <div className="color-picker-wrapper">
                    <span className="color-value">
                      {formData.accessibilityButtonBgColor.toUpperCase()}
                    </span>
                    <input
                      type="color"
                      className="form-control form-control-color"
                      id="accessibilityButtonBgColor"
                      name="accessibilityButtonBgColor"
                      value={formData.accessibilityButtonBgColor}
                      onChange={handleInputChange}
                      title="בחר צבע רקע"
                    />
                  </div>
                </div>

                <div className="color-picker-group rtl">
                  <label
                    htmlFor="accessibilityButtonIconColor"
                    className="form-label fs14 mb-2"
                  >
                    צבע אייקון הכפתור
                  </label>
                  <div className="color-picker-wrapper">
                    <span className="color-value">
                      {formData.accessibilityButtonIconColor.toUpperCase()}
                    </span>
                    <input
                      type="color"
                      className="form-control form-control-color"
                      id="accessibilityButtonIconColor"
                      name="accessibilityButtonIconColor"
                      value={formData.accessibilityButtonIconColor}
                      onChange={handleInputChange}
                      title="בחר צבע אייקון"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
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

            {isSubmitSuccessful && (
              <div className="mt-3">
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
                  }}
                >
                  עבור לערכת הנושא
                </a>
              </div>
            )}
          </div>
        </form>

        {/* Right: Preview Card */}
        <div className="settings-card preview-card">
          <div className="card-header">
            <p className="fw700 fs14 m-0">תצוגה מקדימה</p>
          </div>
          <div className="card-body">
            {renderPreview()}
          </div>
        </div>
      </div>

      {/* steps */}
      <div className="steps mt-4">
        <h4>הדרכה לשימוש במסך זה:</h4>
        {[
          "שלב 1 - עצבו את כפתור הנגישות באמצעות האפשרויות למעלה.",
          'שלב 2 - לחצו על כפתור "הצהרת נגישות" כדי ליצור את תבנית ההצרה שלכם.',
          'שלב 3 - מלאו את הפרטים הנדרשים, אשרו את התנאים ולחצו על "יצירת תוכן דף".',
          'שלב 4 - בשלב זה המערכת יצרה עבורכם את תוכן הצהרת הנגישות, כעת לחצו על "העתק טקסט" כדי להעתיק את התוכן ולאחר מכן לחצו על "מעבר ליצירת עמוד" כדי ליצור עמוד חדש בשופיפיי.',
          "שלב 5 - הדביקו ביצירת העמוד את תוכן הצהרת הנגישות, צרו את העמוד ושמרו את הקישור שלו.",
          'שלב 6 - הדביקו את הקישור לעמוד ההצהרה בהגדרות הנגישות באפליקציה ולחצו על כפתור "שמירה"',
          'שלב 7 - הכנסו ל"הגדרות האפליקציה בערכת הנושא"',
          'שלב 8 - וודאו שהאפליקציה מופעלת וש"Activate accessibility" מסומן.',
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
      {/* End steps */}
    </section>
  );
};
