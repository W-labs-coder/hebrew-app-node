import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Frame, Layout, Page } from "@shopify/polaris";
import Input from "../components/form/Input";
import Button from "../components/form/Button";
import CheckLightIcon from "../components/svgs/CheckLightIcon";
import CancelIcon from "../components/svgs/CancelIcon";
import AlertIcon3 from "../components/svgs/AlertIcon3";
import RtlImage from "../components/svgs/RtlImage";
import AlertDangerIcon from "../components/svgs/AlertDangerIcon";

export default function Language() {
  const [themes, setThemes] = useState([]);

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
        <Page fullWidth>
          <Layout>
            <Layout.Section>
              <div>
                <LanguageSection languages={languages} />
                <BuyNow languages={languages} />
              </div>
            </Layout.Section>
          </Layout>
        </Page>
      </div>
    </div>
  );
}

const LanguageSection = ({  languages }) => {
  
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [shop, setShop] = useState("");
  
  const [isLanguageSubmitSuccessful, setIsLanguageSubmitSuccessful] = useState(false);
  const [isLangaugeLoading, setIsLanguageLoading] = useState(false)

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
    setIsLanguageSubmitSuccessful(false); // Reset when theme changes
  };
 


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
      const language = data.lang.selectedLanguage;
      console.log("Language added successfully", data.lang);
      setSelectedLanguage(language);
      setShop(data.lang.shop);
      setIsLanguageSubmitSuccessful(true);
      setIsLanguageLoading(false)
    } else {
      console.error("Failed to add theme");
      setIsLanguageSubmitSuccessful(false);
      setIsLanguageLoading(false);
    }
  } catch (error) {
    console.error("Error adding theme:", error);
    setIsLanguageSubmitSuccessful(false);
    setIsLanguageLoading(false)
  }
};

const getLanguageEditorUrl = () => {
  const shopifyAdmin = "https://admin.shopify.com/store";
  const themeIdMatch = selectedTheme.match(/\/(\d+)$/);
  const themeId = themeIdMatch ? themeIdMatch[1] : "";
  return `${shopifyAdmin}/${shop.replace(
    ".myshopify.com",
    ""
  )}/settings/languages`;
};

  return (
    <section className="rtl-section">
      <div className="rtl-header">
        <h2 className="rtl-title">שפה</h2>
        <p className="rtl-description">
          הפוך את החנות שלך לנגישה יותר על ידי התאמת אפשרויות שפה ותרגום.
        </p>
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
                חשוב: התקנת הגדרות שפה חדשות תחליף את התצורה הנוכחית שלך. אנא
                גבה את הגדרות השפה הקיימות שלך לפני שתמשיך.
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
          <p className="fs14 fw700">בחרו את שפת האתר המועדפת עליכם:</p>
          <p className="fs14 fw500" style={{ color: "#777" }}>
            בחרו את השפה שברצונכם להחיל על החנות שלכם ואז לחצו. פעולה זו לא תשנה
            את השפה באופן מיידי - ראו הוראות נוספות בהמשך.
          </p>
          <form onSubmit={saveLanguage}>
            <Input
              type="select"
              label="רשימת ערכות הנושא:"
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

     
    </section>
  );
};


const BuyNow = () => {
  const [buyNow, setBuyNow] = useState({
    buyNowText: "",
    buyNowSize: "",
  });
  const [user, setUser] = useState("");
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
        console.log("Buy Now updated successfully:", data);
        setUser(data.user); // Assuming 'shop' is returned from the API
        setIsBuyNowSubmitSuccessful(true);
      } else {
        console.error("Failed to update Buy Now");
      }
    } catch (error) {
      console.error("Error updating Buy Now:", error);
    } finally {
      setIsBuyNowLoading(false);
    }
  };

  const getBuyNowEditor = () => {
    const shopifyAdmin = "https://admin.shopify.com/store";
    // const themeIdMatch = themes?.[0]?.match(/\/(\d+)$/); // Assuming themes is an array
    // const themeId = themeIdMatch ? themeIdMatch[1] : "";
    return `${shopifyAdmin}/${user.shop.replace(
      ".myshopify.com",
      ""
    )}/settings/languages`;
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
      </div>
    </section>
  );
};
