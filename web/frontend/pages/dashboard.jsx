import React, { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Frame, Layout, Page, Modal } from "@shopify/polaris";
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
import Training2 from "../components/svgs/Training2";
import { useDispatch } from "react-redux";
import { login } from "../store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const categoryContents = [
  {
    name: "תצוגה מימין לשמאל (RTL)",
    icon: Rtl2,
    content: "שנה את כיוון התצוגה של האתר שלך מימין לשמאל בלחיצה אחת!",
    button: "הגדרת RTL",
    link: "/rtl",
    permission: "rtl",
  },
  {
    name: "תרגום שפה לעברית ",
    icon: Language2,
    content: "תרגם את ערכת הנושא שלך לעברית באופן מיידי",
    button: "הגדרות שפה",
    link: "/language",
    permission: "language",
  },
  {
    name: "כפתור WhatsApp",
    icon: Whatsapp2,
    content:
      "הוסף כפתור WhatsApp לאתר שלך, כדי לאפשר ללקוחות לפנות אליך בקלות דרך ווטסאפ",
    button: "הגדר עכשיו",
    link: "/whatsapp",
    permission: "whatsapp",
  },
  {
    name: "סמלים ותווי אמון",
    icon: Payment2,
    content:
      "הוסף לאתר שלך בקלות לוגואים של כרטיסי אשראי, משלוחים חינם, החזרות, ותווי אמון נוספים – לחיזוק תחושת הביטחון של הלקוחות והגדלת ההמרות.",
    button: "הגדר עכשיו",
    link: "/payment",
    permission: "payment",
  },

  {
    name: "התראות",
    icon: Alert2,
    content:
      "ודאו שהלקוחות שלכם מקבלים התראות בעברית - התאימו את הטקסט לשפה ולמותג שלכם!",
    button: "הגדרות הודעות",
    link: "/alerts",
    permission: "notifications",
  },
  {
    name: "מצב שבת",
    icon: Sabbath2,
    content:
      "הגדר את שעות השבת של החנות שלך לסגירה ופתיחה אוטומטית, תוך שמירה על לקוחות מעודכנים לגבי לוח הזמנים שלך.",
    button: "קבע שבת",
    link: "/sabbath",
    permission: "shabbatMode",
  },

  {
    name: "כתובת אוטומטית",
    icon: AutomaticFocus2,
    content:
      "הכלי שלנו לכתובת אוטומטית מעדכן את כתובות ההזמנה הנכנסות בהתאם לקלט של הלקוח, ומייעל את תהליך עיבוד ההזמנות שלך.",
    button: "הגדרת מיקוד אוטומטי",
    link: "/postal",
    permission: "zipCode",
  },
  {
    name: "נגישות",
    icon: Accessibility2,
    content:
      "הפעל תוסף נגישות כדי לשפר את השימושיות של האתר שלך עבור משתמשים עם מוגבלויות. אפשרות בלחיצה אחת להצהרת נגישות כלולה!",
    button: "הגדרת נגישות",
    link: "/accessibility",
    permission: "accessibility",
  },
  {
    name: "הגדרות מתקדמות",
    icon: Training2,
    content:
      "התאמת הגדרות עיצוב מתקדמות - מיועדות למשתמשים בעלי ידע טכני בלבד.",
    button: "עבור לדף ההנחיות",
    link: "/training",
    permission: "training",
  },
  // {
  //   name: "CSS",
  //   icon: Css2,
  //   content: "שנה את הגדרות העיצוב המתקדמות - למשתמשים עם מומחיות טכנית בלבד.",
  //   button: "הגדרת CSS מותאם",
  //   link: "css",
  // },
];

export default function dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate()
  const userPermissions = useSelector(state => state.auth.subscription?.subscription?.permissions);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [showPermissionModal, setShowPermissionModal] = React.useState(false);
  const [pendingLink, setPendingLink] = React.useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("אינך מחובר/ת!");
      navigate("/");
    }
    // if (!userPermissions || !userPermissions.includes("dashboard")) {
    //   toast.error("You do not have permission to access this page.");
    //   navigate("/");
    // }
    // Check subscription status when the component mounts
      checkSubscription();
    }, []);
  
    const checkSubscription = async () => {
      try {
        const response = await fetch("/api/billing/check-subscription", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          const subscription = data.subscription;
          dispatch(login({ user:data.user, subscription }));
          if(!subscription){
             toast.warning("לא נמצא מנוי פעיל");
            navigate('/')
          }
          
        } else {
          console.error("Failed to fetch subscription");
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };

  const handleBlocked = (link) => {
    setPendingLink(link);
    setShowPermissionModal(true);
  };

  const handleUpgrade = () => {
    setShowPermissionModal(false);
    setPendingLink(null);
    navigate("/plans");
  };

  const handleCancel = () => {
    setShowPermissionModal(false);
    setPendingLink(null);
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Page fullWidth>
          <Layout>
            <Layout.Section>
              <div className="rtl-section">
                <WelcomeSection />
                <VideoIntroSection />
                <SettingsCategorySection
                  permissions={userPermissions}
                  onBlocked={handleBlocked}
                />
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

const WelcomeSection = () => (
  <section>
    <div>
      <p className="fw700 fs18">ברוכים הבאים לאפליקציה בעברית</p>
      <p className="fs14 ms-lg-5" style={{ color: "#777" }}>
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
        צפו במדריך הקצר הזה כדי להשתמש באפליקציה בקלות
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

const SettingsCategorySection = ({ permissions, onBlocked }) => {
  return (
    <section>
      <div>
        <p className="fs18 fw700">קטגוריית הגדרות</p>
        <p className="fs14" style={{ color: "#777" }}>
          התאימו את חנות ה-Shopify שלכם לחוויית קנייה ייחודית בישראל בלחיצה אחת על
          כל קטגוריה.
        </p>
      </div>
      <div className="row aic" style={{ gap: "16px", marginTop: "16px" }}>
        {categoryContents.map((content, index) => (
          <CategoryCard
            key={index}
            content={content}
            hasPermission={permissions?.includes(content.permission)}
            onBlocked={onBlocked}
          />
        ))}
      </div>
    </section>
  );
};

const CategoryCard = ({ content, hasPermission, onBlocked }) => {
  const SvgIcon = content.icon;
  const navigate = useNavigate();
  const handleNav = (link) => {
    if (hasPermission) {
      navigate(link);
    } else {
      onBlocked(link);
    }
  };
  return (
    <div
      className="col-lg-5 col-md-5 col-12 d-flex flex-column jcb flex-fill"
      style={{
        border: "1px solid #C6C6C6",
        backgroundColor: "#FBFBFB",
        gap: "15px",
        borderRadius: "16px",
        padding: "16px", height:'200px'
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
