import React from "react";
import { useLocation } from "react-router-dom";
import DashboardIcon from "./svgs/DashboardIcon";
import RtlIcon from "./svgs/RtlIcon";
import LanguageIcon from "./svgs/LanguageIcon";
import PaymentIcon from "./svgs/PaymentIcon";
import WhatsAppIcon from "./svgs/WhatsAppIcon";
import SabbathIcon from "./svgs/SabbathIcon";
import AccessibiltyIcon from "./svgs/AccessibiltyIcon";
import AutomaticFocusIcon from "./svgs/AutomaticFocusIcon";
import CssIcon from "./svgs/CssIcon";
import TransactionCancellationIcon from "./svgs/TransactionCancellationIcon";
import CancellationHistoryIcon from "./svgs/CancellationHistoryIcon";
import TrainingIcon from "./svgs/TrainingIcon";
import SupportIcon from "./svgs/SupportIcon";
import AlertIcon from "./svgs/AlertIcon";

const mainMenu = [
  {
    title: "בַּיִת",
    slug: "dashboard",
    icon: DashboardIcon,
    link: "/dashboard",
    permissions: "dashboard",
  },
  {
    title: "RTL",
    slug: "rtl",
    link: "/rtl",
    icon: RtlIcon,
    permissions: "rtl",
  },
  {
    title: "כפתור שפה ודינאמי",
    slug: "language",
    link: "/language",
    icon: LanguageIcon,
    permissions: "language",
  },
  {
    title: "אמצעי תשלום",
    slug: "payment",
    link: "/payment",
    icon: PaymentIcon,
    permissions: "payment",
  },
  {
    title: "תצורת WhatsApp",
    slug: "whatsapp",
    link: "/whatsapp",
    icon: WhatsAppIcon,
    permissions: "whatsapp",
  },
  {
    title: "שַׁבָּת",
    slug: "sabbath",
    link: "/sabbath",
    icon: SabbathIcon,
    permissions: "sabbath",
  },
  {
    title: "התראות",
    slug: "alerts",
    link: "/alerts",
    icon: AlertIcon,
    permissions: "alerts",
  },
  {
    title: "נגישות",
    slug: "accessibility",
    link: "/accessibility",
    icon: AccessibiltyIcon,
    permissions: "accessibility",
  },
  {
    title: "מיקוד אוטומטי",
    slug: "automatic-focus",
    link: "/postal",
    icon: AutomaticFocusIcon,
    permissions: "automatic-focus",
  },
  {
    title: "CSS",
    slug: "css",
    link: "/css",
    icon: CssIcon,
    permissions: "css",
  },
  {
    title: "ביטולי עסקאות",
    slug: "transaction-cancellation",
    link: "/orders/transaction-cancellation",
    icon: TransactionCancellationIcon,
    permissions: "transaction-cancellation",
  },
  {
    title: "היסטוריית ביטולים",
    slug: "cancellation-history",
    link: "/orders/cancellation-history",
    icon: CancellationHistoryIcon,
    permissions: "cancellation-history",
  },
  {
    title: "הדרכה",
    slug: "training",
    link: "/training",
    icon: TrainingIcon,
    permissions: "training",
  },
  {
    title: "תמיכה",
    slug: "support",
    link: "/support",
    icon: SupportIcon,
    permissions: "support",
  },
];

const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const handleNav = (link) => {
    window.location.href = link;
  };

  return (
    <div
      style={{ padding: "24px", backgroundColor: "white" }}
      className="sidebar"
    >
      {mainMenu.map((item, index) => {
        const isActive = currentPath === item.link;
        const SvgIcon = item.icon;

        return (
          <div
            key={index}
            className="d-flex align-items-center my-3"
            style={{
              width: "100%",
              backgroundColor: isActive ? "#FBB105" : "transparent",
              borderRadius: "8px",
              height: "36px",
              padding: "12px 16px",
              cursor: "pointer",
            }}
          >
            <div style={{ width: "40px" }}>
              <SvgIcon style={{ fill: isActive ? "#0C449B" : "#000" }} />
            </div>
            <a
              onClick={() => handleNav(item.link)}
              style={{
                textDecoration: "none",
                marginLeft: "8px",
                color: isActive ? "#0D0D0D" : "#000",
                fontWeight: isActive ? "700" : "400",
              }}
            >
              {item.title}
            </a>
          </div>
        );
      })}
    </div>
  );
};

export default Sidebar;
