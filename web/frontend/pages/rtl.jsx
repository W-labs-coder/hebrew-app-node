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
        <Page fullWidth>
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
        dispatch(login({ user: data.user }));
        setThemeLoading(false);
        setIsSubmitSuccessful(true);
        toast.success('Theme Selected Successfully')
      } else {
        console.error("Failed to add theme");
        setIsSubmitSuccessful(false);
        setThemeLoading(false);
        toast.error("Error Adding Theme");
      }
    } catch (error) {
      console.error("Error adding theme:", error);
      setIsSubmitSuccessful(false);
      setThemeLoading(false);
      toast.error("Error Adding Theme");
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
        <h2 className="rtl-title">RTL</h2>
        <p className="rtl-description">
          התאם בקלות את הפריסה שלך לנוחות ונגישות בקריאה מימין לשמאל
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
            background: "#021341",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <div class="d-flex jcb aic">
            <div class="d-flex aic gap-2">
              <AlertIcon3 />
              <p class="fs14" style={{ color: "#FFF" }}>
                לקוחות יקרים, הוספנו עבורכם תמיכה לתבניות הבאות:
              </p>
            </div>
            <CancelIcon />
          </div>
        </div>

        <div
          style={{ backgroundColor: "#FBFBFB", lineHeight: "21px !important" }}
        >
          <p class="fs14" style={{ color: "#777" }}>
            Alchemy, Alpha, Area, Aronic, Artz, Athens, August, Aurora, Aurum,
            Avone, Ayush, Baseline, Be, Belliza, Berlin, Beyond, Bioearth,
            Biona, Blockshop, Blum, Boost, Booster, Broadcast, Broccoli,
            Brooklyn, Cafesa, Camamas, Canopy, Canyon, Capital, Caros, Cartior,
            Classy, Colorblock, Combine, Concept, ContentIL, Copenhagen,
            CornerStone, Craft, Crave, Dawn, Debut, Debutify, Denim, Digital,
            District, Ecom, Ecomify, Ecomprofithub, Ecomus, Ecomwithmichael,
            Editions, Electro, ElectroElectronics, Electronics, Ella, Emerge,
            Empire, Enterprise, Envy, Esrar, Essence, Exclusive, Expanse, FKX,
            Fashionopolism, Fastor, Fetch, Flexion, Flow, Focal, Forge, Foxic,
            Frame, Furniture, Furrie, Gain, Gecko, Gravity, Habitat, Halo,
            Harmic, Honey, Housei, Impact, Impulse, Influence, Kabbalah, Kala,
            Kalles, Kidxtore, Kodo, Koka, Krismotion, LeanDawn, Lezada, Local,
            Loft, Lumia, Lushy, Lusion, Luxe, Mate, Mavon, Milton, Minimalin,
            Minimalista, Minimog, Minion, Modular, Mojave, Mojuri, Morata,
            Motion, MrParker, Neat, Neytiri, NfDigital, North, Odora, Origin,
            Oworganic, PaloAlto, Paper, Parallax, PerchFashion, Pesto, Petshop,
            Pop, PoseTheme, Prestige, ProfitParadise, Publisher, Pukabop,
            Pursuit, Rebel, Reformation, Refresh, Ride, Sahara, Sense, Shapes,
            Shovalstudio, Showcase, Shrine, ShrinePro, Slumberhome, Sofine,
            Spark, Split, Spotlight, Spozy, Stark, Starlite, Startup, Stella,
            Stellar, Stiletto, Story, Streamline, Studio, SuitUp, Sunrise,
            Suruchi, Sweeny, Symmetry, TJ, Taste, Tifaret, Toykio, Toyqo, Trade,
            Tritiya, Turbo, Umino, Unsen, Upscale, VeanVision, Veena, Venture,
            Venue, Vogue, Warehouse, Wokiee,
          </p>
        </div>
      </div>

      <div className="theme-selector">
        <p className="fs18 fw700">
          התאם בקלות את יישור האתר שלך מימין לשמאל (RTL) כדי להבטיח תאימות מלאה
          עם השפה שבחרת.
        </p>
        <p className="fs14 fw500" style={{ color: "#777" }}>
          במידה וערכת הנושא שלכם לא נמצאת כאן, צרו איתנו קשר ואנחנו נדאג להעלות
          אותה עבורכם.
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
                  כדי להתאים אישית את הנושא שלך כראוי, שם התבנית חייב להתחיל בשם
                  התבנית המקורי.
                </p>
                <p class="fs14 fw500" style={{ color: "#C6C6C6" }}>
                  דוגמה: עבור תבנית "שחר", שם התבנית שלך חייב להתחיל ב"שחר".
                  עדכן את שם התבנית במסך הגדרות החנות לפי הצורך.
                </p>
              </div>
            </div>
            <CancelIcon />
          </div>
        </div>

        <div className="d-flex jcb">
          <form onSubmit={handleSubmit}>
            <Input
              type="select"
              label="רשימת ערכות הנושא:"
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
              ערכת נושא נוכחית:{" "}
              <span className="fw700">
                {themes.find((theme) => theme.id === selectedTheme)?.name || ""}
              </span>
            </p>

            <Button loading={themeLoading} type="submit">
              הגדרת אמצעי תשלום
            </Button>
          </form>
          <RtlImage />
        </div>

        {isSubmitSuccessful && (
          <a
            href={getThemeEditorUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="button"
            style={{
              display: "inline-block",
              marginTop: "10px",
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "#ffffff",
              textDecoration: "none",
              borderRadius: "5px",
              fontWeight: "bold",
            }}
          >
            עבור לערכת הנושא
          </a>
        )}
        <p class="fs14" style={{ marginTop: "10px" }}>
          נתקלים בקושי למצוא את חבילת הנושא שלכם? צרו קשר ואנחנו נדאג להוסיף
          אותה עבורכם.
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
