import React from "react";
import Sidebar from "../components/Sidebar";
import { Frame, Layout, Page } from "@shopify/polaris";
import VideoSvg from "../components/svgs/VideoSvg";
import Rtl2 from "../components/svgs/Rtl2";
import Button from "../components/form/Button";
import Language2 from "../components/svgs/Language2";
import Payment2 from "../components/svgs/Payment2";
import Fonts2 from "../components/svgs/Fonts2";
import Whatsapp2 from "../components/svgs/Whatsapp2";
import Sabbath2 from "../components/svgs/Sabbath2";
import Alert2 from "../components/svgs/Alert2";
import Accessibility2 from "../components/svgs/Accessibility2";
import AutomaticFocus2 from "../components/svgs/AutomaticFocus2";
import Css2 from "../components/svgs/Css2";

const categoryContents = [
  {
    name: "ימין לשמאל",
    icon: Rtl2,
    content: "שנו את היישור של האתר שלכם מימין לשמאל - בלחיצת כפתור!",
    button: "הגדרת RTL",
    link: "rtl",
  },
  {
    name: "כפתור שפה ודינאמי",
    icon: Language2,
    content:
      "תרגמו את האתר שלכם לעברית במהירות ותאפשרו לקהל שלכם לקרוא באתר באופן שהם מכירים ורגילים אליו.",
    button: "שפת הגדרה",
    link: "language",
  },
  {
    name: "אמצעי תשלום",
    icon: Payment2,
    content:
      "הוסיפו לאתר את סמלי אמצעי התשלום המקומיים (ויזה, ביט וכו') בהתאם לאופן התשלום שאתם מקבלים בהזמנות - בכמה קליקים בודדים!",
    button: "הגדרת אמצעי תשלום",
    link: "payment",
  },
  {
    name: "גופנים",
    icon: Fonts2,
    content:
      "הוכח כי הפונט של האתר עשוי לגרום ללמעלה מ-15% מהגולשים להישאר באתר. כדאי לשנות את הפונט שלכם! יש תמיכה בפונטים בעברית.",
    button: "הגדרת גופן",
    link: "fonts",
  },
  {
    name: "תצורת WhatsApp",
    icon: Whatsapp2,
    content: "הגדר הודעת פתיחה של WhatsApp כדי לברך מבקרים בחזית החנות שלך.",
    button: "הגדר עכשיו",
    link: "whatsapp",
  },
  {
    name: "שַׁבָּת",
    icon: Sabbath2,
    content:
      "הגדר את שעות השבת של החנות שלך כך שייסגרו ויפתחו מחדש באופן אוטומטי, תוך עדכון ללקוחות לגבי שעות הפעילות שלך",
    button: "קבע שבת",
    link: "sabbath",
  },
  {
    name: "התראות",
    icon: Alert2,
    content:
      "אין סיבה שהלקוחות שלכם יקבלו התראות למייל באנגלית - שנו עכשיו והתאימו את המלל לשפה ולמותג שלכם!",
    button: "הגדרות הודעות",
    link: "alert",
  },
  {
    name: "נגישות",
    icon: Accessibility2,
    content:
      "הפעילו תוסף נגישות על מנת לשפר את ידידותיות השימוש באתר שלכם לגולשים בעלי מוגבלויות. יש אפשרות גם להצהרת נגישות בקליק!",
    button: "הגדרת נגישות",
    link: "accessibility",
  },
  {
    name: "מיקוד אוטומטי",
    icon: AutomaticFocus2,
    content:
      "באמצעות כלי המיקוד האוטומטי, המערכת שלנו יכולה לעדכן אוטומטית את המיקוד בהזמנות הנכנסות בהתאם לכתובת שהלקוח הזין.",
    button: "הגדרת מיקוד אוטומטי",
    link: "automatic-focus",
  },
  {
    name: "CSS",
    icon: Css2,
    content: "שינוי הגדרות עיצוב מתקדמות - למשתמשים בעלי יידע טכני בלבד.",
    button: "הגדרת CSS מותאם",
    link: "css",
  },
];

export default function dashboard() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
      <Page fullWidth>
        <Layout>
          <Layout.Section>
            <div>
              <WelcomeSection />
              <VideoIntroSection />
              <SettingsCategorySection />
            </div>
          </Layout.Section>
        </Layout>
      </Page>
      </div>
    </div>
  );
}

const WelcomeSection = () => (
  <section>
    <div>
      <p className="fw700 fs18">ברוכים הבאים לאפליקציה בעברית</p>
      <p className="fs14 me-lg-5" style={{ color: "#777" }}>
        ברוכים הבאים לאפליקציה בעברית! האפליקציה המובילה בשוק שנותנת לכם את כל
        האפשרויות לגרום לאתר שלכם לדבר עם הלקוח הישראלי בשפתו המקומית.
        לנוחיותכם, האפליקציה מתעדכנת מעת לעת. תהנה! 🙂
      </p>
    </div>
  </section>
);

const VideoIntroSection = () => (
  <section>
    <div
      style={{
        margin: "16px 0",
        border: "1px solid #C6C6C6",
        borderRadius: "16px",
        padding: "16px",
        gap: "16px",
        backgroundColor: "#FBFBFB",
      }}
    >
      <p className="fw700 fs18">וידאו מבוא</p>
      <p className="fs14" style={{ color: "#777" }}>
        צפו בווידאו המבוא הקצר הזה שיעזור לכם לנווט בקלות באפליקציה
      </p>
      <div
        style={{
          border: "3px solid #C6C6C6",
          borderRadius: "12px",
          height: "419px",
          backgroundColor: "#FBFBFB",
        }}
        className="d-flex aic jcc"
      >
        <div className="d-flex flex-column aic jcc">
          <VideoSvg />
          <p className="fs14" style={{ color: "#777" }}>
            כאן יופיע תוכן הווידאו
          </p>
        </div>
      </div>
    </div>
  </section>
);

const SettingsCategorySection = () => (
  <section>
    <div>
      <p className="fs18 fw700">קטגוריית הגדרות</p>
      <p className="fs14" style={{ color: "#777" }}>
        בלחיצה אחת על כל קטגוריה, תוכל בקלות להתאים את חנות ה-Shopify שלך לחוויה
        הייחודית שלך בישראל.
      </p>
    </div>
    <div className="row aic" style={{ gap: "16px", marginTop: "16px" }}>
      {categoryContents.map((content, index) => (
        <CategoryCard key={index} content={content} />
      ))}
    </div>
  </section>
);

const CategoryCard = ({ content }) => {
  const SvgIcon = content.icon;
  const handleNav = (link) => {
    window.location.href = link;
  };
  return (
    <div
      className="col-lg-5 col-md-5 col-12 d-flex flex-column jcs flex-fill"
      style={{
        border: "1px solid #C6C6C6",
        backgroundColor: "#FBFBFB",
        gap: "45px",
        borderRadius: "16px",
        padding: "16px",
      }}
    >
      <div className="d-flex gap-2 aic">
        <SvgIcon />
        <p className="fs14 fw700">{content.name}</p>
      </div>
      <p className="fs14">{content.content}</p>
      <div>
        <Button variant="primary" onClick={() => handleNav(content.link)}>
          {content.button}
        </Button>
      </div>
    </div>
  );
};
