import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Frame, Layout, Page } from "@shopify/polaris";
import Input from "../components/form/Input";
import Button from "../components/form/Button";
import CheckLightIcon from "../components/svgs/CheckLightIcon";
import CancelIcon from "../components/svgs/CancelIcon";
import AlertIcon3 from "../components/svgs/AlertIcon3";
import RtlImage from "../components/svgs/RtlImage";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../store/slices/authSlice";
import { toast } from "react-toastify";

export default function Rtl() {
  const [themes, setThemes] = useState([]);

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      const response = await fetch("/api/settings/get-themes", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setThemes(data.themes);
      } else {
        console.error("Failed to fetch themes");
      }
    } catch (error) {
      console.error("Error fetching themes:", error);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Page >
          <Layout>
            <Layout.Section>
              <div>
                <RTLSection themes={themes} />
              </div>
            </Layout.Section>
          </Layout>
        </Page>
      </div>
    </div>
  );
}

const RTLSection = ({ themes }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);
  const [selectedTheme, setSelectedTheme] = useState(user?.selectedTheme || "");
  const [shop, setShop] = useState("");
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);
  const [themeLoading, setThemeLoading] = useState(false);
  const dispatch = useDispatch();

  const handleThemeChange = (e) => {
    setSelectedTheme(e.target.value);
    setIsSubmitSuccessful(false); // Reset when theme changes
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setThemeLoading(true);
    try {
      const response = await fetch("/api/settings/add-selected-theme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ themeId: selectedTheme }),
      });
      if (response.ok) {
        const data = await response.json();
        const theme = data.user.selectedTheme;
        setSelectedTheme(theme);
        setShop(data.user.shop);
        dispatch(login({ user: data.user, subscription: data.subscription }));
        setThemeLoading(false);
        setIsSubmitSuccessful(true);
        toast.success("ערכת הנושא שלך עודכנה");
      } else {
        console.error("הוספת העיצוב נכשלה");
        setIsSubmitSuccessful(false);
        setThemeLoading(false);
        toast.error("שגיאה בהוספת ערכת נושא");
      }
    } catch (error) {
      console.error("שגיאה בהוספת ערכת נושא:", error);
      setIsSubmitSuccessful(false);
      setThemeLoading(false);
      toast.error("שגיאה בהוספת ערכת נושא");
    }
  };

  const getThemeEditorUrl = () => {
    const shopifyAdmin = "https://admin.shopify.com/store";
    const themeIdMatch = user?.selectedTheme.match(/\/(\d+)$/);
    const themeId = themeIdMatch ? themeIdMatch[1] : "";
    return `${shopifyAdmin}/${shop.replace(
      ".myshopify.com",
      ""
    )}/themes/${themeId}/editor?context=apps`;
  };

  return (
    <section className="rtl-section">
      <div className="rtl-header">
        <h2 className="rtl-title">תצוגה מימין לשמאל (RTL)</h2>
        <p className="rtl-description">
          אופטימיזציה של העיצוב שלך לשיפור הקריאות והנגישות כאשר אתה משתמש בטקסט
          מימין לשמאל.
        </p>
      </div>

      <div className="theme-selector">
        <p className="fs18 fw700">
          יישר את האתר שלך מימין לשמאל כדי לשלב בצורה חלקה את השפה העברית.
        </p>
        <p className="fs14 fw500" style={{ color: "#777" }}>
          אם התבנית שלך שלך לא מופיעה כאן, אנא צור קשר ואנחנו נדאג להוסיף אותו
          עבורך.
        </p>

        <div
          style={{
            background: "#021341",
            borderRadius: "10px",
            padding: "16px",
          }}
          className="my-4"
        >
          <div class="d-flex jcb aic">
            <div class="d-flex aic gap-2">
              <AlertIcon3 />
              <div>
                <p class="fs14 fw700" style={{ color: "#FBFBFB" }}>
                  כדי להתאים אישית את התבנית כראוי, ודא ששם התבנית שלך מתחיל בשם
                  התבנית המקורי.
                </p>
                <p class="fs14 fw500" style={{ color: "#C6C6C6" }}>
                  דוגמה: עבור תבנית dawn, התחל את השם ב"dawn". תוכל לשנות את שם
                  התבנית בהגדרות החנות שלך.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex jcb">
          <form onSubmit={handleSubmit}>
            <Input
              type="select"
              label="התבנית:"
              id="theme"
              name="theme"
              options={themes}
              placeholder="בחר נושא"
              value={selectedTheme}
              onChange={handleThemeChange}
            />
            <p
              className="fs14 fw500"
              style={{ marginTop: "10px", color: "#333" }}
            >
              תבנית נוכחית:{" "}
              <span className="fw700">
                {themes.find((theme) => theme.id === selectedTheme)?.name || ""}
              </span>
            </p>

            <Button loading={themeLoading} type="submit">
              שמור
            </Button>
          </form>
          <RtlImage />
        </div>

        {isSubmitSuccessful && (
          <a
            href={getThemeEditorUrl()}
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
        <p class="fs14" style={{ marginTop: "10px" }}>
          לא מצליחים למצוא את התבנית שלכם? צרו קשר, ונוסיף אותה במהירות לרשימת
          התבניות שלנו.
        </p>
      </div>

      <div className="steps">
        <h4>שלבים:</h4>

        {[
          "שלב 1 - בחרו את ערכת הנושא מהרשימה.",
          'שלב 2 - לחצו "שמירה".',
          'שלב 3 - הכנסו ל"הגדרות האפליקציה בערכת הנושא".',
          'שלב 4 - וודאו שהאפליקציה מופעלת וש"Activate RTL" מסומן.',
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
    </section>
  );
};
