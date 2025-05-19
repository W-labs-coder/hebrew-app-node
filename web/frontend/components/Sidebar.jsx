import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { useSelector } from "react-redux";
import Logo from "./svgs/Logo";
import { Modal, Button } from "@shopify/polaris"; // Add this import if using Polaris, or use your own modal

export const mainMenu = [
  {
    title: "בַּיִת",
    slug: "dashboard",
    icon: DashboardIcon,
    link: "/dashboard",
    permissions: "dashboard",
  },
  {
    title: "הגדרות RTL",
    slug: "rtl",
    link: "/rtl",
    icon: RtlIcon,
    permissions: "rtl",
  },
  {
    title: "שפה",
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
    title: "כפתור WhatsApp",
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
    permissions: "shabbatMode",
  },
  {
    title: "התראות",
    slug: "alerts",
    link: "/alerts",
    icon: AlertIcon,
    permissions: "notifications",
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
    permissions: "zipCode",
  },
  // {
  //   title: "CSS",
  //   slug: "css",
  //   link: "/css",
  //   icon: CssIcon,
  //   permissions: "css",
  // },
  {
    title: "ביטולי עסקאות",
    slug: "transaction-cancellation",
    link: "/orders/transaction-cancellation",
    icon: TransactionCancellationIcon,
    permissions: "transactionPolicy",
  },
  {
    title: "היסטוריית ביטולים",
    slug: "cancellation-history",
    link: "/orders/cancellation-history",
    icon: CancellationHistoryIcon,
    permissions: "transactionPolicy",
  },
  {
    title: "הדרכה",
    slug: "training",
    link: "/training",
    icon: TrainingIcon,
    permissions: "support",
  },
  {
    title: "תמיכה",
    slug: "support",
    link: "/support",
    icon: SupportIcon,
    permissions: "support",
  },
  {
    title: "תמיכה",
    slug: "plans",
    link: "/plans",
    icon: SupportIcon,
    permissions: "dashboard",
  },
];

const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [pendingLink, setPendingLink] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const userPermissions = useSelector(state => state.auth.subscription?.subscription?.permissions);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const handleNav = (link, permission) => {
    if (!userPermissions?.includes(permission)) {
      setPendingLink(link);
      setShowPermissionModal(true);
      return;
    }
    navigate(link);
  };

  const handleUpgrade = () => {
    setShowPermissionModal(false);
    navigate("/plans");
  };

  const handleCancel = () => {
    setShowPermissionModal(false);
    setPendingLink(null);
  };

  const filteredMenu = mainMenu.filter((content) =>
    userPermissions?.includes(content.permissions)
  );

  if (isMobile) {
    return null; // Don't render sidebar on mobile
  }

  return (
    <>
      <div
        style={{
          padding: "24px",
          backgroundColor: "white",
          position: "fixed",
          top: 0,
          right: 0,
          width: "260px",
          height: "100vh",
          overflowY: "auto",
          zIndex: 1000,
        }}
        className="sidebar"
      >
        <Logo />
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
              <div style={{ width: "40px" }} onClick={() => handleNav(item.link, item.permissions)}>
                <SvgIcon style={{ fill: isActive ? "#0C449B" : "#000" }} />
              </div>
              <a
                onClick={() => handleNav(item.link, item.permissions)}
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
    </>
  );
};

export default Sidebar;
