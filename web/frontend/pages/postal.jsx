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
import CheckDarkIcon from "../components/svgs/CheckDarkIcon";

export default function Postal() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Page>
          <Layout>
            <Layout.Section>
              <div>
                <PostalSettings />
              </div>
            </Layout.Section>
          </Layout>
        </Page>
      </div>
    </div>
  );
}

const PostalSettings = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    autofocusDetection: user?.autofocusDetection || "disabled",
    autofocusCorrection: user?.autofocusCorrection || "disabled",
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setIsSubmitSuccessful(false);

    try {
      const response = await fetch("/api/settings/update-postal-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
        credentials: "include", 
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "שמירת ההגדרות נכשלה");
      }

      const data = await response.json();
      
      if (data.user) {
        dispatch(login({ user: data.user, subscription:data.subscription }));
      }

      setIsSubmitSuccessful(true);
      toast.success("ההגדרות נשמרו בהצלחה");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "שמירת ההגדרות נכשלה");

      if (error.message.includes("Unauthorized") || error.message.includes("session")) {
        window.location.href = "/auth";
        return;
      }
    } finally {
      setIsSubmitting(false);
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

  const [autofocusDetections, setAutofocusDetections] = useState([
    { id: "enabled", name: "דולק" },
    { id: "disabled", name: "כבוי" },
  ]);
  const [autofocusCorrections, setAutofocusCorrections] = useState([
    { id: "enabled", name: "דולק" },
    { id: "disabled", name: "כבוי" },
  ]);

  return (
    <section>
      <div>
        <p className="fw700 fs18">מיקוד אוטומטי</p>
        <p className="fs14 fw500" style={{ color: "#777" }}>
          שפר את תהליך הקנייה שלך עם זיהוי ותיקון אוטומטי של מיקוד עבור כתובות
          בישראל.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
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
                  <p className="fs14 fw700" style={{ color: "#FBFBFB" }}>
                    הערה: המערכת שלנו מוצאת מיקוד באופן אוטומטי על ידי השוואת
                    כתובות עם מאגר הנתונים של דואר ישראל. למרות שזה חוסך זמן,
                    הדיוק תלוי ברשומות שלהם - אנא ודאו את הקוד במהלך תהליך
                    התשלום.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              backgroundColor: "#FBFBFB",
              lineHeight: "21px",
              border: "1px solid #C6C6C6",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            {/* steps 1 */}
            <div className="d-flex jcb gap-2 ">
              <div style={{ width: "100%" }}>
                <div>
                  <div className="d-flex flex-column justify-content-end align-items-start mb-2">
                    <div className="rtl" style={{ width: "100%" }}>
                      <p className="fs14 fw700">איתור מיקוד אוטומטי</p>
                      <p className="fs14 fw500">
                        פשטו את הזנת הכתובת עבור הלקוחות שלכם. אפשרו זיהוי
                        אוטומטי של מיקוד לכל הזמנה.
                      </p>
                      <div className="steps-gray mt-4">
                        <h4>איך זה עובד</h4>
                        {[
                          " לקוח פותח הזמנה חדשה באתר",
                          "אם הוא הזין כתובת ומיקוד בעצמו, האפליקציה לא נוגעת בהזמנה",
                          "אם הלקוח לא הזין מיקוד אלא רק כתובת, ומערכת איתור המיקוד האוטומטי הופעלה, האפליקציה תחפש את הכתובת באתר דואר ישראל בשמכם ותזין את המיקוד שנמצא אל תוך ההזמנה!",
                        ].map((item) => (
                          <div
                            className="d-flex aic gap-3 mb-2"
                            style={{ justifyContent: "flex-start" }}
                            key={item}
                          >
                            <CheckDarkIcon />
                            <p className="fs14">{item}</p>
                          </div>
                        ))}
                      </div>
                      {/* end steps 1 */}
                      <Input
                        type="select"
                        label="איתור מיקוד אוטומטי"
                        id="autofocusDetection"
                        name="autofocusDetection"
                        options={autofocusDetections}
                        value={formData.autofocusDetection}
                        onChange={handleInputChange}
                        placeholder="דלוק"
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
            </div>
          </div>
        </div>
        {/* End Section 1 */}
        {/* Section 2 */}
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
          >
            {/* steps 1 */}
            <div className="d-flex jcb gap-2 ">
              <div style={{ width: "100%" }}>
                <div>
                  <div className="d-flex flex-column justify-content-end align-items-start mb-2">
                    <div className="rtl" style={{ width: "100%" }}>
                      <p className="fs14 fw700">תיקון אוטומטי של מיקוד</p>
                      <p className="fs14 fw500">
                        מנעו עיכובי משלוח עקב מיקוד לא נכון. המערכת שלנו יכולה
                        לאמת ולתקן אוטומטית את הכניסות של קודי המיקוד.
                      </p>
                      <div className="steps-gray mt-4">
                        <h4>איך זה עובד</h4>
                        {[
                          " לקוח פותח הזמנה חדשה באתר",
                          "האפליקציה לוקחת את כתובת הלקוח מתוך ההזמנה ושולחת את הכתובת לבדיקה מול דואר ישראל.",
                          "אם הלקוח הזין מיקוד לא תקין, ומערכת תיקון המיקוד האוטומטי הופעלה, האפליקציה תזין את המיקוד התקין שנמצא אל תוך ההזמנה!",
                        ].map((item) => (
                          <div
                            className="d-flex aic gap-3 mb-2"
                            style={{ justifyContent: "flex-start" }}
                            key={item}
                          >
                            <CheckDarkIcon />
                            <p className="fs14">{item}</p>
                          </div>
                        ))}
                      </div>
                      {/* end steps 1 */}
                      <Input
                        type="select"
                        label="תיקון מיקוד אוטומטי"
                        id="autofocusCorrection"
                        name="autofocusCorrection"
                        options={autofocusCorrections}
                        value={formData.autofocusCorrection}
                        onChange={handleInputChange}
                        placeholder="דלוק"
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
            </div>
          </div>
        </div>
        {/* End Section 2 */}

        {/* steps */}
        <div className="steps mt-4">
          <h4>הדרכה לשימוש במסך זה:</h4>
          {[
            'שלב 1 - הפעילו את מערכת איתור המיקוד האוטומטי ע"י לחיצה על הכפתור למעלה, כך שיופיע טקסט "המערכת פועלת"',
            "שלב 2 - נסו לבצע הזמנה עם כתובת תקינה ותראו איך המיקוד מתעדכן באופן מיידי.",
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
