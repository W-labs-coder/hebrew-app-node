import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Frame, Layout, Page, Modal } from "@shopify/polaris";
import Input from "../components/form/Input";
import Button from "../components/form/Button";
import CheckLightIcon from "../components/svgs/CheckLightIcon";
import CancelIcon from "../components/svgs/CancelIcon";
import AlertIcon3 from "../components/svgs/AlertIcon3";
import RtlImage from "../components/svgs/RtlImage";
import AlertDangerIcon from "../components/svgs/AlertDangerIcon";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../store/slices/authSlice";
import FontsImage from "../components/svgs/FontsImage";

export default function Language() {
  const [themes, setThemes] = useState([]);
  const userPermissions = useSelector(state => state.auth.subscription?.subscription?.permissions);

  // Modal state
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Handler for blocked actions
  const handleBlocked = () => setShowPermissionModal(true);
  const handleUpgrade = () => {
    setShowPermissionModal(false);
    window.location.href = "/plans";
  };
  const handleCancel = () => setShowPermissionModal(false);

  // Helper to check permission
  const hasPermission = (perm) => userPermissions?.includes(perm);

  const fonts = [
    {
      id: "alef",
      name: "Alef",
      value: "alef",
    },
    {
      id: "amatic sc",
      name: "Amatic SC",
      value: "amatic sc",
    },
    {
      id: "arimo",
      name: "Arimo",
      value: "arimo",
    },
    {
      id: "assistant",
      name: "Assistant",
      value: "assistant",
    },
    {
      id: "bellefair",
      name: "Bellefair",
      value: "bellefair",
    },
    {
      id: "bona nova",
      name: "Bona Nova",
      value: "bona nova",
    },
    {
      id: "cousine",
      name: "Cousine",
      value: "cousine",
    },
    {
      id: "david libre",
      name: "David Libre",
      value: "david libre",
    },
    {
      id: "frank ruhl libre",
      name: "Frank Ruhl Libre",
      value: "frank ruhl libre",
    },
    {
      id: "fredoka",
      name: "Fredoka",
      value: "fredoka",
    },
    {
      id: "heebo",
      name: "Heebo",
      value: "heebo",
    },
    {
      id: "ibm plex sans hebrew",
      name: "IBM Plex Sans Hebrew",
      value: "ibm plex sans hebrew",
    },
    {
      id: "karantina",
      name: "Karantina",
      value: "karantina",
    },
    {
      id: "miriam libre",
      name: "Miriam Libre",
      value: "miriam libre",
    },
    {
      id: "noto rashi hebrew",
      name: "Noto Rashi Hebrew",
      value: "noto rashi hebrew",
    },
    {
      id: "noto sans hebrew",
      name: "Noto Sans Hebrew",
      value: "noto sans hebrew",
    },
    {
      id: "open sans",
      name: "Open Sans",
      value: "open sans",
    },
    {
      id: "rubik",
      name: "Rubik",
      value: "rubik",
    },
    {
      id: "secular one",
      name: "Secular One",
      value: "secular one",
    },
    {
      id: "suez one",
      name: "Suez One",
      value: "suez one",
    },
    {
      id: "tinos",
      name: "Tinos",
      value: "tinos",
    },
    {
      id: "varela round",
      name: "Varela Round",
      value: "varela round",
    },
   
  ];
  const languages = [
    {
      id: "hebrew",
      name: "Hebrew",
      value: "hebrew",
    },
  ];
  

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Page >
          <Layout>
            <Layout.Section>
              <div>
                {hasPermission("language") ? (
                  <LanguageSection languages={languages} />
                ) : (
                  <Button onClick={handleBlocked}>הפעל תרגום שפה</Button>
                )}
                {hasPermission("buyNowText") ? (
                  <BuyNow />
                ) : (
                  <Button onClick={handleBlocked}>הפעל שינוי טקסט קנייה</Button>
                )}
                {hasPermission("fonts") ? (
                  <Fonts fonts={fonts} />
                ) : (
                  <Button onClick={handleBlocked}>הפעל גופנים</Button>
                )}
              </div>
            </Layout.Section>
          </Layout>
        </Page>
      </div>
      {/* Permission Modal */}
      <Modal
        open={showPermissionModal}
        onClose={handleCancel}
        title="אין לך הרשאה"
        primaryAction={{
          content: "שדרג עכשיו",
          onAction: handleUpgrade,
        }}
        secondaryActions={[
          {
            content: "ביטול",
            onAction: handleCancel,
          },
        ]}
      >
        <Modal.Section>
          <p>אין לך הרשאה לגשת לאזור זה. שדרג את התוכנית שלך כדי לקבל גישה.</p>
        </Modal.Section>
      </Modal>
    </div>
  );
}

const LanguageSection = ({  languages }) => {
  
  const user = useSelector((state) => state.auth.user);
  const [selectedLanguage, setSelectedLanguage] = useState(user?.selectedLanguage || "");
  const [shop, setShop] = useState("");
  const [isLanguageSubmitSuccessful, setIsLanguageSubmitSuccessful] = useState(false);
  const [isLangaugeLoading, setIsLanguageLoading] = useState(false)

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
    setIsLanguageSubmitSuccessful(false); // Reset when theme changes
  };
 
const dispatch = useDispatch() 
const saveLanguage = async (e) => {
  e.preventDefault();
  setIsLanguageLoading(true)
  try {
    const response = await fetch("/api/settings/add-selected-language", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ language: selectedLanguage }),
    });
    if (response.ok) {
      const data = await response.json();
      const language = data.user.selectedLanguage;
      toast.success(" הפונט עודכן בהצלחה ");
      setSelectedLanguage(language);
      setShop(data.user.shop);
      dispatch(login({ user: data.user, subscription:data.subscription }));
      setIsLanguageSubmitSuccessful(true);
      setIsLanguageLoading(false)
    } else {
      console.error("Failed to add theme");
      setIsLanguageSubmitSuccessful(false);
      setIsLanguageLoading(false);
      toast.error("Error Adding Language");
    }
  } catch (error) {
    console.error("Error adding theme:", error);
    setIsLanguageSubmitSuccessful(false);
    setIsLanguageLoading(false)
    toast.error("Error Adding Language");
  }
};

const getLanguageEditorUrl = () => {
  const shopifyAdmin = "https://admin.shopify.com/store";
  // const themeIdMatch = selectedTheme.match(/\/(\d+)$/);
  // const themeId = themeIdMatch ? themeIdMatch[1] : "";
  return `${shopifyAdmin}/${shop.replace(
    ".myshopify.com",
    ""
  )}/settings/languages`;
};

  return (
    <section className="rtl-section">
      <div className="rtl-header">
        <h2 className="rtl-title">תרגום שפה לעברית </h2>
      </div>

      <div
        class="d-flex flex-column jcs"
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
            background: "#FDCED2",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <div class="d-flex jcb aic">
            <div class="d-flex aic gap-2">
              <AlertDangerIcon />
              <p class="fs14 fw500" style={{ color: "#0D0D0D" }}>
                שימו לב: תרגום השפה יחליף את ערכת השפה הקיימת באתר וידרוס אותה.
                לשם בטיחות, אנא גבו את ערכת השפה הנוכחית שלכם.
              </p>
            </div>
            <CancelIcon color="#0D0D0D" />
          </div>
        </div>

        <div
          class="d-flex flex-column jcs"
          style={{
            border: "1px solid #C6C6C6",
            borderRadius: "16px",
            padding: "16px",
            gap: "16px",
            backgroundColor: "#FBFBFB",
          }}
        >
          <div style={{ width: "70%" }}>
            <p className="fs14 fw700">תרגמו את ערכת הנושא שלכם לשפה העברית </p>

            <form onSubmit={saveLanguage} style={{ marginBottom: "16px" }}>
              <Input
                type="select"
                label=""
                id="language"
                name="language"
                options={languages}
                placeholder="בחר נושא"
                value={selectedLanguage}
                onChange={handleLanguageChange}
              />

              <Button type="submit" loading={isLangaugeLoading}>
                שמור
              </Button>
            </form>
            {isLanguageSubmitSuccessful && (
              <a
                href={getLanguageEditorUrl()}
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
            <div className="steps">
              <h4>הדרכה לשימוש במסך זה:</h4>

              {[
                'שלב 1 - בחרו את בשפה העברית ולחצו על כפתור ה"שמירה" באפליקציה.',
                "שלב 2 - לחצו על הכפתור התחתון (הגדרת שפות) כדי לנווט למסך הגדרות השפה.",
                "שלב 3 - לחצו על הכפתור של ה-3 נקודות ליד השפה המוגדרת כברירת מחדל, ובחרו ב-'Change Default'",
                "שלב 4 - בחר את השפה העברית מהרשימה.",
                'שלב 5 - לחץ על כפתור "שמור".',
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
        </div>
      </div>
    </section>
  );
};


const BuyNow = () => {
  const user = useSelector((state) => state.auth.user);
  const [buyNow, setBuyNow] = useState({
    buyNowText: user?.buyNowText || "",
    buyNowSize: user?.buyNowSize || "",
  });
  
  const dispatch = useDispatch();
  
  const [isBuyNowSubmitSuccessful, setIsBuyNowSubmitSuccessful] =
    useState(false);
  const [isBuyNowLoading, setIsBuyNowLoading] = useState(false);

  const handleBuyNowChange = (e) => {
    const { name, value } = e.target;
    setBuyNow((prevBuyNow) => ({
      ...prevBuyNow,
      [name]: value,
    }));
    setIsBuyNowSubmitSuccessful(false);
  };
  

  const saveBuyNow = async (e) => {
    e.preventDefault();
    setIsBuyNowLoading(true);
    try {
      const response = await fetch("/api/settings/add-buy-now", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buyNow),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(login({ user: data.user, subscription:data.subscription }));
        setIsBuyNowSubmitSuccessful(true);
        
        toast.success(" הפונט עודכן בהצלחה ");
      } else {
        console.error("Failed to update Buy Now");
      }
    } catch (error) {
      console.error("Error updating Buy Now:", error);
      toast.error('Could not add buy now text')
    } finally {
      setIsBuyNowLoading(false);
    }
  };

  const getBuyNowEditor = () => {
    const shopifyAdmin = "https://admin.shopify.com/store";
     const themeIdMatch = user?.selectedTheme.match(/\/(\d+)$/);
     const themeId = themeIdMatch ? themeIdMatch[1] : "";
     return `${shopifyAdmin}/${user?.shop.replace(
       ".myshopify.com",
       ""
     )}/themes/${themeId}/editor?context=apps`;
  };

  return (
    <section className="rtl-section">
      <div
        className="d-flex flex-column"
        style={{
          margin: "16px 0",
          border: "1px solid #C6C6C6",
          borderRadius: "16px",
          padding: "16px",
          gap: "16px",
          backgroundColor: "#FBFBFB",
        }}
      >
        <form onSubmit={saveBuyNow}>
          <Input
            type="text"
            label="שינוי הטקסט של כפתור קנייה:"
            id="buy_now_text"
            name="buyNowText"
            placeholder="הקלד כאן כדי לשנות טקסט..."
            value={buyNow.buyNowText}
            onChange={handleBuyNowChange}
          />
          <Input
            type="number"
            label="גודל הטקסט של כפתור קנייה:"
            id="buy_now_size"
            name="buyNowSize"
            placeholder="הזן כאן את גודל הטקסט..."
            value={buyNow.buyNowSize}
            onChange={handleBuyNowChange}
          />

          <Button type="submit" loading={isBuyNowLoading}>
            שמור
          </Button>
        </form>
        {isBuyNowSubmitSuccessful && (
          <a
            href={getBuyNowEditor()}
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
        <div className="steps mt-4">
          {/* <h4>הדרכה לשימוש במסך זה:</h4> */}

          {[
            "שלב 1 - כתבו את הטקסט שאתם מעוניינים שיופיע על כפתור קנייה.",
            'שלב 2 - לחצו "שמירה"',
            'שלב 3 - הכנסו ל"הגדרות האפליקציה בהערכת נושא"',
            'שלב 4 - וודאו שהאפליקציה מופעלת ושמסומן "Translation"',
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
    </section>
  );
};


const Fonts = ({fonts}) => {
  const user = useSelector((state) => state.auth.user);
  const [font, setFont] = useState(
    user?.font || "",
  );

  

  const dispatch = useDispatch();

  const [isFontSubmitSuccessful, setIsFontSubmitSuccessful] =
    useState(false);
  const [isFontLoading, setIsFontLoading] = useState(false);

  const handleFontChange = (e) => {
    const { name, value } = e.target;
    setFont(value)
  };
   

  const saveFont = async (e) => {
    e.preventDefault();
    setIsFontLoading(true);
    try {
      const response = await fetch("/api/settings/add-font", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ font }),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(login({ user: data.user, subscription:data.subscription }));
        setIsFontSubmitSuccessful(true);

        toast.success(" הפונט עודכן בהצלחה ");
      } else {
        console.error("Failed to update Font");
      }
    } catch (error) {
      console.error("Error updating Font:", error);
      toast.error("Could not add Font, " + error.response.data.message);
    } finally {
      setIsFontLoading(false);
    }
  };

  const getFontEditor = () => {
    const shopifyAdmin = "https://admin.shopify.com/store";
    const themeIdMatch = user?.selectedTheme.match(/\/(\d+)$/);
    const themeId = themeIdMatch ? themeIdMatch[1] : "";
    return `${shopifyAdmin}/${user?.shop.replace(
      ".myshopify.com",
      ""
    )}/themes/${themeId}/editor?context=apps`;
  };

  return (
    <section className="rtl-section">
      <p className="fw700 fs18">התאמת גופנים</p>
      <p className="fw500 fs14" style={{ color: "#777 !important" }}>
        בחר את סגנון הגופן המועדף עליך לקריאה אופטימלית
      </p>
      <div
        className="d-lg-flex jcb"
        style={{
          margin: "16px 0",
          border: "1px solid #C6C6C6",
          borderRadius: "16px",
          padding: "16px",
          gap: "16px",
          backgroundColor: "#FBFBFB",
        }}
      >
        <div className="d-flex flex-column">
          <p className="fs14 fw700 mb-0">בחר שפה וגופן:</p>
          <p className="fs14 fw500 mb-0" style={{ color: "#777" }}>
            "בחר את השפה שלך, בחר סגנון גופן, ואז לחץ על 'שמור'"
          </p>
          <form onSubmit={saveFont}>
            <Input
              type="select"
              label=""
              id="font"
              name="font"
              options={fonts}
              placeholder="בחר גופן"
              value={font}
              onChange={handleFontChange}
            />

            <Button type="submit" loading={isFontLoading}>
              שמור
            </Button>
          </form>
          {/* Font Preview */}
        
          {isFontSubmitSuccessful && (
            <a
              href={getFontEditor()}
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

          <div className="steps">
            <h4>הדרכה לשימוש במסך זה:</h4>

            {[
              "שלב 1 - בחרו את הפונט המועדף עליכם מרשימת הגופנים",
              'שלב 2 - לחצו "שמירה״',
              "שלב 3 - הכנסו להגדרות האפליקציה בערכת הנושא",
              'שלב 4 - וודאו שהאפליקציה מופעלת וש" Enable Alternative Font" מסומן',
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
        <div>
          <FontsImage />
          {/* Font Preview */}
          {font && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                border: "1px dashed #C6C6C6",
                borderRadius: "8px",
                background: "#fff",
                minWidth: "220px",
                maxWidth: "300px",
              }}
            >
              <p className="fs14 fw700 mb-2">תצוגה מקדימה:</p>
              <span
                style={{
                  fontFamily: `'${font}', sans-serif`,
                  fontSize: "22px",
                  direction: "rtl",
                  display: "block",
                  color: "#222",
                }}
              >
                זהו טקסט לדוגמה בעברית
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
