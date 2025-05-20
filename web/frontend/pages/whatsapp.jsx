import React, { useState, useEffect } from "react";
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
import { Form } from "react-bootstrap";
import WhatsappIcon from "../components/svgs/WhatsAppIcon";
import WhatsappIconPreview from "../components/svgs/WhatsappIconPreview";
import UserAvatar from "../components/svgs/UserAvatar";
import Swal from "sweetalert2";

export default function Whatsapp() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Page>
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
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const [selectedPosition, setSelectedPosition] = useState(
    user?.whatsappPosition || "right"
  );
  const [selectedStyle, setSelectedStyle] = useState(
    user?.whatsappStyle || "text_and_icon"
  );

  const [formData, setFormData] = useState({
    whatsappNumber: user?.whatsappNumber || "",
    buttonLabel: user?.buttonLabel || "",
    whatsappPosition: user?.whatsappPosition || "right",
    whatsappStyle: user?.whatsappStyle || "text_and_icon",
    whatsappText: user?.whatsappText || "",
    buttonBgColor: user?.buttonBgColor || "#22d465",
    buttonTextColor: user?.buttonTextColor || "#FFFFFF",
    buttonIconColor: user?.buttonIconColor || "#FFFFFF",
    includeProductDetails: user?.includeProductDetails || false,
    enableDefaultMessage: user?.enableDefaultMessage || false,
    defaultMessage: user?.defaultMessage || "",
    enableWidget: user?.enableWidget || false,
    contacts: user?.contacts || [], // Initialize with user's contacts
    titleBgColor: user?.titleBgColor || "#05B457",
    titleTextColor: user?.titleTextColor || "#FFFFFF",
  });

  const [welcomeSettings, setWelcomeSettings] = useState({
    enableWelcomeMessage: user?.enableWelcomeMessage || false,
    welcomeMessage: user?.welcomeMessage || "",
    messageFrequency: user?.messageFrequency || 1,
    messageDelay: user?.messageDelay || 0,
  });

  const [contacts, setContacts] = useState(user?.contacts || []); // Update contacts state to use user's contacts
  const [editingContact, setEditingContact] = useState(null);
  const [newContact, setNewContact] = useState({
    name: "",
    role: "",
    phone: "",
  });

  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Replace the existing state for isSubmitting with separate states for each section
  const [submittingSections, setSubmittingSections] = useState({
    general: false,
    defaultMessage: false,
    widget: false
  });

  useEffect(() => {
    if (user?.contacts) {
      setContacts(user.contacts);
      setFormData((prev) => ({
        ...prev,
        contacts: user.contacts,
      }));
    }
  }, [user]);

  const validateForm = () => {
    if (!formData.whatsappNumber) {
      toast.error("WhatsApp number is required");
      return false;
    }

    const phoneNumberRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneNumberRegex.test(formData.whatsappNumber.replace(/\s+/g, ""))) {
      toast.error(
        "Invalid WhatsApp number format. Please use international format (e.g. +972501234567)"
      );
      return false;
    }

    return true;
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  // Update the handleSubmit function to accept a section parameter
  const handleSubmit = async (event, section) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
  
    // Set only the specific section as submitting
    setSubmittingSections(prev => ({ ...prev, [section]: true }));
    setIsSubmitSuccessful(false);
  
    try {
      // Combine formData and welcomeSettings
      const dataToSend = {
        ...formData,
        ...welcomeSettings,
        contacts: contacts // Make sure to include contacts array
      };
  
      console.log('Sending data:', dataToSend);
  
      const response = await fetch("/api/settings/update-whatsapp-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Cache-Control": "no-cache"
        },
        credentials: 'include',
        body: JSON.stringify(dataToSend),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update WhatsApp settings');
      }
  
      const data = await response.json();
      
      // Update Redux store with new user data
      if (data.user) {
        dispatch(login({ user: data.user, subscription:data.subscription }));
      }
  
      setIsSubmitSuccessful(true);
      toast.success("הגדרות WhatsApp נשמרו ");
  
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to update WhatsApp settings');
      
      // Handle session expiration
      if (error.message.includes('Unauthorized') || error.message.includes('session')) {
        window.location.href = '/auth';
        return;
      }
    } finally {
      // Reset only the specific section's loading state
      setSubmittingSections(prev => ({ ...prev, [section]: false }));
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
        const productDetails = window.location.pathname.includes('/products/') 
          ? `\nProduct: ${window.location.pathname.split('/products/')[1]}`
          : '';
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
      toast.error("Could not open WhatsApp. Please check the phone number format.");
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

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setNewContact(contact);
    setShowModal(true);
  };

  const handleDeleteContact = async (contactId) => {
    // Show confirmation dialog
    const result = await Swal.fire({
      title: "האם אתה בטוח?",
      text: "לא ניתן יהיה לשחזר את איש הקשר הזה!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "כן, מחק!",
      cancelButtonText: "ביטול",
      reverseButtons: true,
      customClass: {
        container: "rtl",
      },
    });

    // If user confirmed deletion
    if (result.isConfirmed) {
      try {
        setIsLoading(true);

        const response = await fetch(
          `/api/settings/whatsapp/contacts/${contactId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete contact");
        }

        const data = await response.json();

        if (data.success) {
          // Update contacts state
          const updatedContacts = contacts.filter(
            (contact) => contact._id !== contactId
          );
          setContacts(updatedContacts);
          setFormData((prev) => ({
            ...prev,
            contacts: updatedContacts,
          }));

          if (data.user) {
            dispatch(
              login({ user: data.user, subscription: data.subscription })
            );
          }

          toast.success('איש הקשר נמחק בהצלחה')
        }
      } catch (error) {
        console.error("Error deleting contact:", error);
        Swal.fire({
          title: "שגיאה!",
          text: error.message || "מחיקת איש הקשר נכשלה",
          icon: "error",
          confirmButtonText: "אישור",
          customClass: {
            container: "rtl",
          },
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ""));
  };

  const handleAddOrUpdateContact = async () => {
    setIsLoading(true);
    let retryCount = 0;
    const maxRetries = 3;

    const attemptUpdate = async () => {
      try {
        // Basic validation
        if (!newContact.name || !newContact.role || !newContact.phone) {
          toast.error("All fields are required");
          return false;
        }

        if (!validatePhoneNumber(newContact.phone)) {
          toast.error("פורמט מספר טלפון לא חוקי");
          return false;
        }

        let updatedContacts;
        if (editingContact) {
          updatedContacts = contacts.map((c) =>
            c._id === editingContact._id ? { ...newContact, _id: c._id } : c
          );
        } else {
          const newId = new Date().getTime().toString();
          updatedContacts = [...contacts, { ...newContact }];
        }

        const updatedFormData = {
          ...formData,
          ...welcomeSettings,
          contacts: updatedContacts,
        };

        const response = await fetch("/api/settings/update-whatsapp-settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify(updatedFormData),
          credentials: "include",
        });

        // Handle session expiration
        if (response.status === 401) {
          toast.error("Session expired. Redirecting to login...");
          // Redirect to auth page or trigger re-authentication
          window.location.href = "/auth"; // Adjust this URL as needed
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

        // Update local state
        setContacts(updatedContacts);
        setShowModal(false);
        setEditingContact(null);
        setNewContact({ name: "", role: "", phone: "" });

        if (data.user) {
          dispatch(login({ user: data.user, subscription:data.subscription }));
        }

        toast.success(
          editingContact ? "איש הקשר עודכן בהצלחה" : "איש הקשר נוסף בהצלחה"
        );

        return true;

      } catch (error) {
        console.error("Error attempt #" + (retryCount + 1) + ":", error);
        
        if (retryCount < maxRetries - 1) {
          retryCount++;
          toast.info(`מנסה שוב... ניסיון ${retryCount + 1} of ${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          return await attemptUpdate();
        }
        
        if (error.message.includes('authentication') || error.message.includes('session')) {
          toast.error("Authentication error. Please try logging in again.");
          window.location.href = "/auth";
          return;
        }
        toast.error(error.message || "שמירת איש הקשר נכשלה");
        return false;
      }
    };

    try {
      const success = await attemptUpdate();
      if (success) {
        setShowModal(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section>
      <div>
        <p className="fw700 fs18">הגדרות WhatsApp </p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, "general")}>
        {/* Section 1 */}
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
                  </div>

                  <div className="rtl">
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
                    <div className=" d-flex gap-3">
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
                    <div className=" d-flex gap-3">
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
                  <div className="d-flex gap-1 flex-wrap">
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

                <div className="rtl mt-3">
                  <Form.Check
                    type="checkbox"
                    id="includeProductDetails"
                    checked={formData.includeProductDetails}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        includeProductDetails: e.target.checked,
                      }));
                    }}
                    label="כלול פרטי מוצר בתחילת הצ'אט עם הלקוח"
                    className="fs14 rtl"
                  />
                </div>
                <div className="mt-4">
                  <Button
                    type="submit"
                    disabled={submittingSections.general}
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
                    {submittingSections.general ? (
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
                        // margin: "0 auto",
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
        {/* End Section 1 */}

        {/* Section 2 */}

        {/* End Section 2 */}

        {/* Section 3 - Default Messages */}
        <div
          style={{
            margin: "16px 0",
            border: "1px solid #C6C6C6",
            borderRadius: "16px",
            padding: "16px",
            backgroundColor: "#FBFBFB",
          }}
        >
          <div
            className="d-flex jcb"
            style={{
              backgroundColor: "#FBFBFB",
              width: "100%",
              border: "1px solid #C6C6C6",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            <div style={{ width: "60%" }}>
              <div className="mb-4">
                <p className="fw700 fs14">הודעות ברירת מחדל</p>
                <p className="fs14 fw500" style={{ color: "#777" }}>
                  הגדר הודעה אוטומטית שתופיע כאשר לקוחות לוחצים על כפתור הצ'אט.
                </p>
              </div>

              <div className="rtl">
                <p className="fw700 fs14 mb-0">אפשר הודעות ברירת מחדל</p>
                <div className="mb-4 d-flex justify-content-between align-items-center">
                  <Form.Check
                    type="switch"
                    id="enableDefaultMessage"
                    checked={formData.enableDefaultMessage}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        enableDefaultMessage: e.target.checked,
                      }));
                    }}
                    className="fs14 rtl"
                  />
                </div>

                <div className="mb-4">
                  <Input
                    type="textarea"
                    label="טקסט ההודעה"
                    id="defaultMessage"
                    name="defaultMessage"
                    placeholder="הזן את הודעת ברירת המחדל שתופיע בצ'אט"
                    value={formData.defaultMessage}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        defaultMessage: e.target.value,
                      }));
                    }}
                    disabled={!formData.enableDefaultMessage}
                    style={{
                      minHeight: "100px",
                      resize: "vertical",
                      direction: "rtl",
                    }}
                  />
                </div>

                <div className="mt-4">
                  <Button
                    type="submit"
                    disabled={submittingSections.defaultMessage}
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
                    {submittingSections.defaultMessage ? (
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

                  {/* Add the Editor URL link */}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End Section 3 */}

        {/* Section 4 - Widget Customization */}
        <div
          style={{
            margin: "16px 0",
            border: "1px solid #C6C6C6",
            borderRadius: "16px",
            padding: "16px",
            backgroundColor: "#FBFBFB",
          }}
        >
          <div
            style={{
              backgroundColor: "#FBFBFB",
              width: "100%",
              border: "1px solid #C6C6C6",
              borderRadius: "10px",
              padding: "16px",
            }}
            className="d-flex jcb ais"
          >
            {/* Left Column */}
            <div style={{ width: "60%" }}>
              <div className="mb-4">
                <p className="fw700 fs14">הוספת מספר חשבונות וואטספ</p>
                <p className="fs14 fw500" style={{ color: "#777" }}>
                  חבר לשירות הלקוחות של האתר כמה סוכני שירות לקוחות שונים.
                </p>
              </div>

              <div className="rtl">
                <div className="mb-4">
                  <p className="fw700 fs14 mb-0">אפשר וידג'ט</p>
                  <Form.Check
                    type="switch"
                    id="enableWidget"
                    checked={formData.enableWidget}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        enableWidget: e.target.checked,
                      }));
                    }}
                    className="fs14 rtl"
                  />
                </div>

                {formData.enableWidget && (
                  <>
                    <div className="mb-4">
                      <p className="fw700 fs14">שמות ומספרי טלפון</p>
                      {/* Replace the existing table code with this updated version */}
                      <div className="widget-contacts-table">
                        <table className="table mb-0" dir="rtl">
                          <thead className="bg-light">
                            <tr>
                              <th>שם</th>
                              <th>תפקיד</th>
                              <th>מספר טלפון</th>
                              <th style={{ width: "80px" }}>פעולות</th>
                            </tr>
                          </thead>
                          <tbody>
                            {contacts.map((contact) => (
                              <tr key={contact._id}>
                                <td>{contact.name}</td>
                                <td>{contact.role}</td>
                                <td>{contact.phone}</td>
                                <td>
                                  <div className="d-flex gap-2">
                                    <button
                                      className="btn btn-link p-0"
                                      onClick={(e) => {
                                        e.preventDefault(); // Add this to prevent form submission
                                        handleEditContact(contact);
                                      }}
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </button>
                                    <button
                                      className="btn btn-link p-0 text-danger"
                                      onClick={(e) => {
                                        e.preventDefault(); // Add this to prevent form submission
                                        handleDeleteContact(contact._id);
                                      }}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <button
                        className="btn mt-3"
                        style={{
                          backgroundColor: "#FBB105",
                          borderRadius: "24px",
                          padding: "8px 24px",
                        }}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingContact(null);
                          setNewContact({ name: "", role: "", phone: "" });
                          setShowModal(true);
                        }}
                      >
                        הוסף מספר נוסף
                      </button>
                    </div>

                    {/* Add color pickers here, outside of showModal */}
                    <div className="color-pickers-container mt-4">
                      <p className="fw700 fs14 mb-3">צבעי כותרת:</p>
                      <div className="d-flex gap-1 flex-wrap">
                        <div className="color-picker-group rtl">
                          <label
                            htmlFor="titleBgColor"
                            className="form-label fs14 mb-2"
                          >
                            צבע הכותרת
                          </label>
                          <div className="color-picker-wrapper">
                            <span className="color-value">
                              {formData.titleBgColor.toUpperCase()}
                            </span>
                            <input
                              type="color"
                              className="form-control form-control-color"
                              id="titleBgColor"
                              name="titleBgColor"
                              value={formData.titleBgColor}
                              onChange={handleInputChange}
                              title="בחר צבע כותרת"
                            />
                          </div>
                        </div>

                        <div className="color-picker-group rtl">
                          <label
                            htmlFor="titleTextColor"
                            className="form-label fs14 mb-2"
                          >
                            צבע טקסט הכותרת
                          </label>
                          <div className="color-picker-wrapper">
                            <span className="color-value">
                              {formData.titleTextColor.toUpperCase()}
                            </span>
                            <input
                              type="color"
                              className="form-control form-control-color"
                              id="titleTextColor"
                              name="titleTextColor"
                              value={formData.titleTextColor}
                              onChange={handleInputChange}
                              title="בחר צבע טקסט הכותרת"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Add/Edit Contact Modal */}
                    {showModal && (
                      <>
                        <div
                          className="modal d-block"
                          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                        >
                          <div className="modal-dialog">
                            <div className="modal-content">
                              <div className="modal-header">
                                <h5 className="modal-title">
                                  {editingContact
                                    ? "ערוך איש קשר"
                                    : "הוסף איש קשר חדש"}
                                </h5>
                                <button
                                  type="button"
                                  className="btn-close"
                                  onClick={() => setShowModal(false)}
                                ></button>
                              </div>
                              <div className="modal-body">
                                <div className="mb-3">
                                  <label className="form-label">שם</label>
                                  <input
                                    type="text"
                                    className="form-control text-end"
                                    value={newContact.name}
                                    onChange={(e) =>
                                      setNewContact((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="mb-3">
                                  <label className="form-label">תפקיד</label>
                                  <input
                                    type="text"
                                    className="form-control text-end"
                                    value={newContact.role}
                                    onChange={(e) =>
                                      setNewContact((prev) => ({
                                        ...prev,
                                        role: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="mb-3">
                                  <label className="form-label">
                                    מספר טלפון
                                  </label>
                                  <input
                                    type="tel"
                                    className="form-control text-end"
                                    value={newContact.phone}
                                    onChange={(e) =>
                                      setNewContact((prev) => ({
                                        ...prev,
                                        phone: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                              <div className="modal-footer">
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={() => setShowModal(false)}
                                >
                                  ביטול
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  onClick={handleAddOrUpdateContact}
                                  disabled={isLoading}
                                >
                                  {isLoading ? (
                                    <span className="spinner-border spinner-border-sm" />
                                  ) : editingContact ? (
                                    "לְעַדְכֵּן"
                                  ) : (
                                    "לְהוֹסִיף"
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
                <div className="mt-4">
                  <Button
                    type="submit"
                    disabled={submittingSections.widget}
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
                    {submittingSections.widget ? (
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

            {/* Right Column - Preview */}
            <div
              className="preview-container"
              style={{ border: "none", boxShadow: "none" }}
            >
              <p className="fw700 fs14 text-right">תצוגה מקדימה חיה</p>
              <div className="preview-frame">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "0px",
                    width: "253px",
                    height: "192px",
                    boxShadow:
                      "0px 4px 10px -8px rgba(0, 0, 0, 0.2), 0px 0px 0px 1px rgba(0, 0, 0, 0.08)",
                  }}
                >
                  {/* Header Section */}
                  <div
                    style={{
                      boxSizing: "border-box",
                      display: "flex",
                      flexDirection: "row-reverse",
                      justifyContent: "flex-end",
                      alignItems: "flex-start",
                      padding: "21px 10px",
                      gap: "10px",
                      isolation: "isolate",
                      width: "253px",
                      height: "126px",
                      background: formData.titleBgColor,
                      border: "1px solid #C6C6C6",
                      borderRadius: "10px 10px 0px 0px",
                      position: "relative",
                    }}
                  >
                    {/* Close Button */}
                    <button
                      style={{
                        position: "absolute",
                        width: "16px",
                        height: "16px",
                        left: "14px",
                        top: "12px",
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                      }}
                    >
                      <WhatsappIconPreview
                        color={formData.titleTextColor}
                        style={{
                          width: "16px",
                          height: "16px",
                        }}
                      />
                    </button>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        alignItems: "flex-start",
                        padding: "0px",
                        gap: "10px",
                        width: "233px",
                        height: "84px",
                      }}
                    >
                      <span
                        style={{
                          width: "108px",
                          height: "32px",
                          fontFamily: "Inter",
                          fontStyle: "normal",
                          fontWeight: 600,
                          fontSize: "26px",
                          lineHeight: "31px",
                          textAlign: "right",
                          color: formData.titleTextColor,
                        }}
                      >
                        שלום לך!
                      </span>
                      <span
                        style={{
                          width: "233px",
                          height: "42px",
                          fontFamily: "Inter",
                          fontStyle: "normal",
                          fontWeight: 500,
                          fontSize: "14px",
                          lineHeight: "21px",
                          color: formData.titleTextColor,
                          textAlign: "right",
                        }}
                      >
                        .אנחנו כאן כדי לעזור. שוחח איתנו בווטסאפ לכל שאלה
                      </span>
                    </div>
                  </div>

                  {/* Bottom Section */}
                  <div
                    style={{
                      boxSizing: "border-box",
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      padding: "8px 16px 8px 16px",
                      gap: "8px",
                      width: "253px",
                      height: "66px",
                      background: "#FBFBFB",
                      borderWidth: "0px 1px 1px 1px",
                      borderStyle: "solid",
                      borderColor: "#C6C6C6",
                      borderRadius: "0px 0px 10px 10px",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        padding: "0px",
                        gap: "10px",
                        width: "40px",
                        height: "40px",
                        background: "#021341",
                        border: "4px solid rgba(112, 149, 251, 0.3)",
                        borderRadius: "36px",
                      }}
                    >
                      <img
                        src="https://pub-ece2f518b9504c2884b29ab98d7f6283.r2.dev/user-avatar.png"
                        style={{
                          margin: "auto",
                          width: "100%",
                        }}
                      />
                    </div>

                    {/* Text Content */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        padding: "0px",
                        gap: "2px",
                        width: "129px",
                        height: "50px",
                      }}
                    >
                      <span
                        style={{
                          width: "129px",
                          height: "27px",
                          fontFamily: "Inter",
                          fontStyle: "normal",
                          fontWeight: 600,
                          fontSize: "18px",
                          lineHeight: "27px",
                          color: "#0D0D0D",
                        }}
                      >
                        שירות לקוחות
                      </span>
                      <span
                        style={{
                          width: "84px",
                          height: "21px",
                          fontFamily: "Inter",
                          fontStyle: "normal",
                          fontWeight: 500,
                          fontSize: "14px",
                          lineHeight: "21px",
                          color: "#777777",
                        }}
                      >
                        צ'אט איתנו
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End Section 4 */}

        {/* steps */}
        <div className="steps mt-4">
          <h4>הדרכה לשימוש במסך זה:</h4>
          {[
            "שלב 1 - הגדר את מספר ה-WhatsApp שלך (כולל קידומת +972 ) , בחר עיצוב, צבעים והתאם את הוידג׳ט לפי רצונך.",
            "שלב 2 - כנס להגדרות האפליקציה בערכת הנושא.",
            'שלב 3 - אשר הפעלת ״WhatsApp Button״.',
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
      </form>
    </section>
  );
};
