import React, { useState, useEffect } from "react";
import { Layout, Page } from "@shopify/polaris";
import Sidebar from "../../components/Sidebar";
import Input from "../../components/form/Input";
import Button from "../../components/form/Button";
import CheckLightIcon from "../../components/svgs/CheckLightIcon";
import { toast } from "react-toastify";
import { login } from "../../store/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import AlertIcon3 from "../../components/svgs/AlertIcon3";
import CheckDarkIcon from "../../components/svgs/CheckDarkIcon";

export default function TransactionCancellation() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Page>
          <Layout>
            <Layout.Section>
              <div>
                <TransactionCancellationSettings />
              </div>
            </Layout.Section>
          </Layout>
        </Page>
      </div>
    </div>
  );
}

const TransactionCancellationSettings = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    transactionCancellation: user?.transactionCancellation || "disabled",
    email: user?.ownerWebsiteEmail || "",
    termOfUse: user?.termOfUse || "",
    linkTermOfUseWebsite: user?.linkTermOfUseWebsite || "",
    cancellationConditions: user?.cancellationConditions || 'רגע לפני שתבטלו עסקה, אנחנו מזמינים אתכם ליצור איתנו קשר. אם בכל זאת החלטתם לבטל, מלאו את פרטיכם בטופס משמאל ואנו ניצור איתכם קשר בהקדם. א. ביטול עסקה ייעשה תוך 14 ימים מיום קבלת המוצר, או מסמך הגילוי לפי המאוחר ביניהם. ב. בהתאם לחוק הגנת הצרכן, בגין ביטול העסקה תחוייבו בדמי ביטול בשיעור של %5 או 100 ש"ח לפי הנמוך ביניהם. ג. המוצר יוחזר ככל שהדבר אפשרי באריזתו המקורית. ד. החברה תמסור לצרכן עותק של הודעת הזיכוי שמסר העסק לחברת האשראי. ה. לא ניתן לבטל רכישה של מוצרים פסידים, מוצרים שיוצרו במיוחד עבור הצרכן וכן מוצרים הניתנים להקלטה, העתקה ושכפול שהצרכן פתח את אריזתם המקורית.',
    termOfUseBgColor: user?.termOfUseBgColor || "#FFFFFF",
    termOfUseTextColor: user?.termOfUseTextColor || "#000000",
    termOfUseBtnBackgroundColor: user?.termOfUseBtnBackgroundColor || "#021341",
    termOfUseBtnTextColor: user?.termOfUseBtnTextColor || "#FFFFFF",
    pageTitle: user?.pageTitle || "ביטול עסקה",
    titleOfCancellationCondition: user?.titleOfCancellationCondition || "תנאי ביטול עסקה",
    formTitle: user?.formTitle || "טופס ביטול עסקה",
    termOfUseButtonText: user?.termOfUseButtonText || "לצפייה בתנאי השימוש של האתר",
    termOfUseFullName: user?.termOfUseFullName || "שם מלא",
    termOfUseEmail: user?.termOfUseEmail || "דואר אלקטרוני",
    termOfUsePhone: user?.termOfUsePhone || "מספר טלפון",
    orderNumberField: user?.orderNumberField || "מספר הזמנה",
    termOfUseShortMessage: user?.termOfUseShortMessage || "אנא מלא את כל הפרטים הנדרשים בטופס זה",
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
      const response = await fetch("/api/settings/order-cancellation", {
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
        throw new Error(errorData.message || "Failed to update postal settings");
      }

      const data = await response.json();
      
      if (data.user) {
        dispatch(login({ user: data.user }));
      }

      setIsSubmitSuccessful(true);
      toast.success("Postal settings updated successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to update postal settings");

      if (error.message.includes("Unauthorized") || error.message.includes("session")) {
        window.location.href = "/auth";
        return;
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  useEffect(() => {
    generateStoreTermsLink()
  },[])

  const getWhatsAppEditorUrl = () => {
    const shopifyAdmin = "https://admin.shopify.com/store";
    const themeIdMatch = user?.selectedTheme.match(/\/(\d+)$/);
    const themeId = themeIdMatch ? themeIdMatch[1] : "";
    return `${shopifyAdmin}/${user?.shop.replace(
      ".myshopify.com",
      ""
    )}/themes/${themeId}/editor?context=apps`;
  };

  const [transactionCancellations, setTransactionCancellations] = useState([
    { id: "enabled", name: "לְאַפשֵׁר" },
    { id: "disabled", name: "נָכֶה" },
  ]);

  const handleResetCancellationConditions = () => {
    setFormData(prevState => ({
      ...prevState,
      cancellationConditions: ''
    }));
  };

  const handleCopyTermsLink = () => {
    if (formData.linkTermOfUseWebsite) {
      navigator.clipboard.writeText(formData.linkTermOfUseWebsite)
        .then(() => {
          toast.success('הקישור הועתק בהצלחה!');
        })
        .catch(() => {
          toast.error('שגיאה בהעתקת הקישור');
        });
    } else {
      toast.warning('אין קישור להעתקה');
    }
  };

  const handleCopyOrderCancellationLink = () => {
    const orderCancellationPageUrl = `${
      user?.shop
    }/apps/order-cancellation`;
    navigator.clipboard.writeText(orderCancellationPageUrl)
      .then(() => {
        toast.success('הקישור לעמוד ביטול עסקה הועתק בהצלחה!');
      })
      .catch(() => {
        toast.error('שגיאה בהעתקת הקישור לעמוד ביטול עסקה');
      });
  };

  const generateStoreTermsLink = () => {
    if (!user?.shop) {
      toast.error('Store information not available');
      return;
    }
    
    // Convert myshopify domain to store's primary domain
    const storeDomain = user.shop.replace('.myshopify.com', '');
    const termsLink = `${
      user?.shop
    }/apps/order-cancellation`;
    
    setFormData(prevState => ({
      ...prevState,
      termOfUse: termsLink,
      linkTermOfUseWebsite: termsLink
    }));
    
    // toast.success('Terms of service link generated');
  };

  return (
    <section>
      <div>
        <p className="fw700 fs18">ביטולי עסקאות</p>
        <p className="fs14 fw500" style={{ color: "#777" }}>
          בטל בקלות את ההזמנה שלך אם תוכניות משתנות או יש צורך בהתאמות.
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
                    שימו לב! ע"פ חוק אתרי סחר בישראל חייבים לשלב עמוד בקשת ביטול
                    עסקה במקום בולט באתר. יצרנו בשבילכם עמוד מתאים ונוח לגולשים.
                    תהנו! 
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
                      <p className="fs14 fw700">טופס ביטול עסקה</p>
                      <p className="fs14 fw500">
                        באמצעות אפשרות זו תוכלו לפתוח עמוד "ביטול עסקה" נוח
                        ויעיל עבור הלקוחות - והכל בלחיצת כפתור.
                      </p>
                      <div className="steps-gray mt-4">
                        <h4>איך זה עובד</h4>
                        {[
                          " לקוח שמעוניין לבטל עסקה נכנס אל העמוד ומזין את הפרטים",
                          "אתם מקבלים התראה במייל + הבקשה נכנסת לרשימת בקשות בתוך האפליקציה להמשך טיפולכם",
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
                        type="email"
                        label="דואר אלקטרוני של בעל האתר:"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder='הכנס כתובת דוא"ל...'
                      />
                      <Input
                        type="url"
                        label="הקלד כאן את תנאי השימוש..."
                        id="linkTermOfUseWebsite"
                        name="linkTermOfUseWebsite"
                        value={formData.linkTermOfUseWebsite}
                        onChange={handleInputChange}
                        placeholder='הכנס כתובת דוא"ל...'
                      />

                      <div>
                        <p className="fs14 fw700">תנאי ביטול עסקה:</p>
                        <textarea
                          id="cancellationConditions"
                          name="cancellationConditions"
                          value={formData.cancellationConditions}
                          onChange={handleInputChange}
                          style={{ width: "100%", height: "200px" }}
                        ></textarea>
                        <div
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
                          onClick={handleResetCancellationConditions}
                        >
                          איפוס תנאי ביטול עסקה
                        </div>
                      </div>
                      <div className="d-flex gap-2 align-items-end align-items-center">
                        <div style={{ flex: 1 }}>
                          <Input
                            type="text"
                            label="קישור לתנאי השימוש באתר:"
                            id="termOfUse"
                            name="termOfUse"
                            value={formData.termOfUse}
                            onChange={handleInputChange}
                            placeholder="הקלד כאן את הקישור לאתר..."
                            disabled={true}
                          />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "140px",
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
                          onClick={handleCopyOrderCancellationLink}
                        >
                          צור קישור
                        </div>
                      </div>
                      

                      <div className="color-pickers-container mt-4">
                        <p className="fw700 fs14 mb-3">התאמת צבעים:</p>
                        <div className="d-flex gap-1 flex-wrap">
                          <div className="color-picker-group rtl">
                            <label
                              htmlFor="termOfUseBgColor"
                              className="form-label fs14 mb-2"
                            >
                              צבע רקע:
                            </label>
                            <div className="color-picker-wrapper">
                              <span className="color-value">
                                {formData.termOfUseBgColor.toUpperCase()}
                              </span>
                              <input
                                type="color"
                                className="form-control form-control-color"
                                id="termOfUseBgColor"
                                name="termOfUseBgColor"
                                value={formData.termOfUseBgColor}
                                onChange={handleInputChange}
                                title="צבע רקע:"
                              />
                            </div>
                          </div>

                          <div className="color-picker-group rtl">
                            <label
                              htmlFor="termOfUseTextColor"
                              className="form-label fs14 mb-2"
                            >
                              צבע טקסט:
                            </label>
                            <div className="color-picker-wrapper">
                              <span className="color-value">
                                {formData.termOfUseTextColor.toUpperCase()}
                              </span>
                              <input
                                type="color"
                                className="form-control form-control-color"
                                id="termOfUseTextColor"
                                name="termOfUseTextColor"
                                value={formData.termOfUseTextColor}
                                onChange={handleInputChange}
                                title="צבע טקסט:"
                              />
                            </div>
                          </div>

                          <div className="color-picker-group rtl">
                            <label
                              htmlFor="termOfUseBtnBackgroundColor"
                              className="form-label fs14 mb-2"
                            >
                              רקע הכפתור:
                            </label>
                            <div className="color-picker-wrapper">
                              <span className="color-value">
                                {formData.termOfUseBtnBackgroundColor.toUpperCase()}
                              </span>
                              <input
                                type="color"
                                className="form-control form-control-color"
                                id="termOfUseBtnBackgroundColor"
                                name="termOfUseBtnBackgroundColor"
                                value={formData.termOfUseBtnBackgroundColor}
                                onChange={handleInputChange}
                                title="רקע הכפתור:"
                              />
                            </div>
                          </div>

                          <div className="color-picker-group rtl">
                            <label
                              htmlFor="termOfUseBtnTextColor"
                              className="form-label fs14 mb-2"
                            >
                              צבע טקסט הכפתור:
                            </label>
                            <div className="color-picker-wrapper">
                              <span className="color-value">
                                {formData.termOfUseBtnTextColor.toUpperCase()}
                              </span>
                              <input
                                type="color"
                                className="form-control form-control-color"
                                id="termOfUseBtnTextColor"
                                name="termOfUseBtnTextColor"
                                value={formData.termOfUseBtnTextColor}
                                onChange={handleInputChange}
                                title="צבע טקסט הכפתור:"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Input
                        type="text"
                        label="כותרת דף"
                        id="pageTitle"
                        name="pageTitle"
                        value={formData.pageTitle}
                        onChange={handleInputChange}
                        placeholder="הוסף כאן כותרת..."
                      />

                      <Input
                        type="text"
                        label="כותרת תנאי ביטול עסקה"
                        id="titleOfCancellationCondition"
                        name="titleOfCancellationCondition"
                        value={formData.titleOfCancellationCondition}
                        onChange={handleInputChange}
                        placeholder="הוסף כאן את תנאי הביטול..."
                      />

                      <Input
                        type="text"
                        label="כותרת טופס"
                        id="formTitle"
                        name="formTitle"
                        value={formData.formTitle}
                        onChange={handleInputChange}
                        placeholder="הוסף כאן את כותרת הטופס..."
                      />

                      <Input
                        type="text"
                        label="טקסט כפתור תנאי שימוש"
                        id="termOfUseButtonText"
                        name="termOfUseButtonText"
                        value={formData.termOfUseButtonText}
                        onChange={handleInputChange}
                        placeholder="לצפייה בתנאי השימוש של האתר"
                      />

                      <Input
                        type="text"
                        label="שם מלא"
                        id="termOfUseFullName"
                        name="termOfUseFullName"
                        value={formData.termOfUseFullName}
                        onChange={handleInputChange}
                        placeholder="הקלד את שמך המלא כאן..."
                      />

                      <Input
                        type="text"
                        label="דואר אלקטרוני"
                        id="termOfUseEmail"
                        name="termOfUseEmail"
                        value={formData.termOfUseEmail}
                        onChange={handleInputChange}
                        placeholder="הקלד את כתובת האימייל שלך כאן..."
                      />

                      <Input
                        type="text"
                        label="מספר טלפון"
                        id="termOfUsePhone"
                        name="termOfUsePhone"
                        value={formData.termOfUsePhone}
                        onChange={handleInputChange}
                        placeholder="הקלד את מספר הטלפון שלך כאן..."
                      />

                      <Input
                        type="text"
                        label="שדה מספר הזמנה"
                        id="orderNumberField"
                        name="orderNumberField"
                        value={formData.orderNumberField}
                        onChange={handleInputChange}
                        placeholder="הקלד את מספר ההזמנה שלך כאן..."
                      />

                      {/* <div>
                        <p className="fs14 fw700">הודעה קצרה וברורה</p>
                        <textarea
                          id="termOfUseShortMessage"
                          name="termOfUseShortMessage"
                          value={formData.termOfUseShortMessage}
                          onChange={handleInputChange}
                          style={{ width: "100%", height: "200px" }}
                        ></textarea>
                      </div> */}
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

                  {/* {isSubmitSuccessful && (
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
                  )} */}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End Section 1 */}

        {/* steps */}
        <div className="steps mt-4">
          <h4>הדרכה לשימוש במסך זה:</h4>
          {[
            'שלב 1 - הפעילו את מערכת ביטולי עסקאות ע"י לחיצה על הכפתור למעלה, כך שיופיע טקסט "מופעל".',
            'שלב 2 - כדי להוסיף את טופס ביטול העסקאות לחנות שלך, עליך להיכנס לעורך הנושא של שופיפיי (Shopify Theme Editor).',
            'שלב 3 - בעורך הנושא, לחץ על "Add section" (הוסף מקטע), ואז בחר בקטגוריה "Apps". שם תמצא את הבלוק "Order Cancellation Form".',
            'שלב 4 - לאחר הוספת הבלוק, תוכל להתאים את הגדרות העיצוב שלו ישירות מעורך הנושא ולפרסם את השינויים.',
            'שלב 5 - לחלופין, אם העדפתך היא להשתמש בעמוד חיצוני, העתק את הקישור באמצעות כפתור "צור קישור" והוסף אותו לתפריט החנות שלך.',
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
