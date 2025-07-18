import React, { useEffect, useState, useCallback } from "react";
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
import SabbathPreview from "../components/SabbathPreview";
import AlertDangerIcon from "../components/svgs/AlertDangerIcon";

// Add these functions after your imports
const uploadToCloudflare = async (file) => {
  try {
    const response = await fetch("/api/settings/get-upload-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to get upload URL");
    }

    const { uploadUrl, imageId, key } = await response.json();

    // Upload to R2
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
        "x-amz-acl": "public-read",
      },
      mode: "cors", // Explicitly set CORS mode
    });

    console.log("this error", uploadResponse.json());

    return false;

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload to R2");
    }

    // Get the delivery URL
    const deliveryResponse = await fetch(
      `/api/settings/get-image-url/${imageId}`
    );
    if (!deliveryResponse.ok) {
      throw new Error("Failed to get delivery URL");
    }

    const { url } = await deliveryResponse.json();
    return url;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw error;
  }
};

export default function Sabbath() {
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
        <Page>
          <Layout>
            <Layout.Section>
              <div>
                <SabbathSection themes={themes} />
              </div>
            </Layout.Section>
          </Layout>
        </Page>
      </div>
    </div>
  );
}

const SabbathSection = ({ themes }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);
  const [selectedTheme, setSelectedTheme] = useState(user?.selectedTheme || "");
  const [shop, setShop] = useState("");
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);
  const [themeLoading, setThemeLoading] = useState(false);
  const [isSabbathMode, setIsSabbathMode] = useState(false);
  const [isAutoSabbathMode, setIsAutoSabbathMode] = useState(false);
  const [closingDay, setClosingDay] = useState("Friday");
  const [openingDay, setOpeningDay] = useState("Saturday");
  const [closingTime, setClosingTime] = useState("00:00");
  const [openingTime, setOpeningTime] = useState("00:00");
  const [file, setFile] = useState(null);
  const [bannerText, setBannerText] = useState("");
  const [socialLinks, setSocialLinks] = useState([]);
  const [currentLink, setCurrentLink] = useState("");
  const [bannerBgColor, setBannerBgColor] = useState("#FFFFFF");
  const [bannerTextColor, setBannerTextColor] = useState("#000000");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const dispatch = useDispatch();

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);

  const handleThemeChange = (e) => {
    setSelectedTheme(e.target.value);
    setIsSubmitSuccessful(false); // Reset when theme changes
  };

  // Add useEffect to fetch and set initial values
  useEffect(() => {
    const loadSabbathSettings = async () => {
      try {
        const response = await fetch("/api/settings/get-sabbath", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }

        const data = await response.json();
        
        // Update local state with fetched settings
        setIsSabbathMode(data.isSabbathMode || false);
        setIsAutoSabbathMode(data.isAutoSabbathMode || false);
        setClosingDay(data.closingDay || "Friday");
        setOpeningDay(data.openingDay || "Saturday");
        setClosingTime(data.closingTime || "00:00");
        setOpeningTime(data.openingTime || "00:00");
        setBannerText(data.bannerText || "");
        setSocialLinks(data.socialLinks || []);
        setBannerBgColor(data.bannerBgColor || "#FFFFFF");
        setBannerTextColor(data.bannerTextColor || "#000000");
        setFileUrl(data.sabbathFile || null);
        setSelectedTheme(data.selectedTheme || "");
        setShop(data.shop || "");

        // Update Redux state
        dispatch(login({ user: data.user, subscription:data.subscription }));

      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Error loading settings");

        if (error.message.includes("Unauthorized") || error.message.includes("session")) {
          window.location.href = "/auth";
        }
      }
    };

    loadSabbathSettings();
  }, [dispatch]); // Only run on mount and when dispatch changes

  // Then modify your uploadFile function
  const uploadFile = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/settings/upload-sabbath-file', {
        method: 'POST',
        body: formData,
        // Add credentials to ensure session cookies are sent
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Upload failed');
      }

      const data = await response.json();
      setFileUrl(data.fileUrl);
      return data.fileUrl;

    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.message);
      return null;
    }
  };

  // Fix the typo and logic in handleSubmit
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      let uploadedFileUrl = null;

      if (file) {
        uploadedFileUrl = await uploadFile(file);
        setSelectedFile(uploadedFileUrl);
        if (!uploadedFileUrl) {
          toast.error("Error uploading file");
          return;
        }
      }

      // First update settings
      const settingsResponse = await fetch("/api/settings/update-sabbath", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isSabbathMode,
          isAutoSabbathMode,
          closingDay,
          openingDay,
          closingTime,
          openingTime,
          sabbathFile: uploadedFileUrl,
          bannerText,
          socialLinks,
          bannerBgColor,
          bannerTextColor,
        }),
      });

      if (!settingsResponse.ok) throw new Error("Failed to update settings");

      // Then toggle theme with proper theme ID
      const themeResponse = await fetch("/api/settings/toggle-sabbath-theme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isSabbathMode,
          sabbathThemeId: selectedTheme
        }),
      });

      if (!themeResponse.ok) {
        const errorData = await themeResponse.json();
        throw new Error(errorData.message || "Failed to toggle theme");
      }

      // Set submit successful to show theme editor link
      setIsSubmitSuccessful(true);

      // Show success message
      toast.success(isSabbathMode ? 'Sabbath mode activated' : 'Sabbath mode deactivated');
      
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to update settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getThemeEditorUrl = () => {
    const shopifyAdmin = "https://admin.shopify.com/store";
    const themeIdMatch = selectedTheme.match(/\/(\d+)$/);
    const themeId = themeIdMatch ? themeIdMatch[1] : "";
    return `${shopifyAdmin}/${shop.replace(
      ".myshopify.com",
      ""
    )}/themes/${themeId}/editor?context=apps`;
  };

  // Add this helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  return (
    <section className="rtl-section">
      <div className="rtl-header">
        <h2 className="rtl-title">מצב שבת</h2>
        <p className="rtl-description">
          אוטומציה של שמירת השבת בחנות שלכם תוך עדכון הלקוחות על שעות הפעילות
        </p>
      </div>

      <div className="theme-selector">
        <div
          style={{
            background: "#021341",
            borderRadius: "10px",
            padding: "16px",
          }}
          className="my-4"
        >
          <div class="d-flex jcb aic mb-2">
            <div class="d-flex aic gap-2">
              <AlertIcon3 />
              <div>
                <p class="fs14 fw700" style={{ color: "#FBFBFB" }}>
                  הפעלת מצב שבת תסגור ותפתח מחדש את החנות שלכם באופן חלקי בזמנים
                  שנקבעו מראש בכל שבוע.
                </p>
              </div>
            </div>
          </div>
          <div class="d-flex jcb aic">
            <div class="d-flex aic gap-2">
              <AlertDangerIcon />
              <p class="fs14 fw500" style={{ color: "#0D0D0D" }}>
                שימו לב שבמצב שבת, לקוחות לא יוכלו לגשת לחנות שלכם
              </p>
            </div>
            <CancelIcon color="#0D0D0D" />
          </div>
        </div>

        <div className="d-flex flex-column gap-2">
          <div>
            <p className="fw700 fs14">הגדרות מצב שבת</p>
            <p className="fw500 fs14" style={{ color: "#777" }}>
              התאימו את התגובות האוטומטיות של החנות שלכם כך שיהיו ידידותיות יותר
              במהלך שעות השבת.
            </p>
          </div>

          <div>
            <p className="fs14 fw700">כניסה למצב שבת</p>
            <div className="sabbath-switch">
              <div
                onClick={() => setIsSabbathMode(!isSabbathMode)}
                className="switch-container"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "2px",
                  width: "44px",
                  height: "24px",
                  background: isSabbathMode ? "#FBB105" : "#E1E1E1",
                  borderRadius: "24px",
                  cursor: "pointer",
                  transition: "background-color 0.3s ease",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    background: "#FBFBFB",
                    borderRadius: "24px",
                    transform: `translateX(${isSabbathMode ? "-20px" : "0"})`,
                    transition: "transform 0.3s ease",
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <p className="fs14 fw700">מצב שבת באופן אוטומטי</p>
            <div className="sabbath-switch">
              <div
                onClick={() => setIsAutoSabbathMode(!isAutoSabbathMode)}
                className="switch-container"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "2px",
                  width: "44px",
                  height: "24px",
                  background: isAutoSabbathMode ? "#FBB105" : "#E1E1E1",
                  borderRadius: "24px",
                  cursor: "pointer",
                  transition: "background-color 0.3s ease",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    background: "#FBFBFB",
                    borderRadius: "24px",
                    transform: `translateX(${
                      isAutoSabbathMode ? "-20px" : "0"
                    })`,
                    transition: "transform 0.3s ease",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex flex-column gap-4 mt-4">
          <div className="d-flex gap-4 align-items-center">
            <div style={{ width: "150px" }}>
              <p className="fs14 fw700 mb-2">יום הסגירה</p>
              <select
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
                className="form-select"
                style={{
                  padding: "8px 16px",
                  border: "1px solid #C6C6C6",
                  borderRadius: "10px",
                  width: "100%",
                  direction: "rtl",
                }}
              >
                <option value="Friday">שישי</option>
                <option value="Saturday">שבת</option>
              </select>
            </div>

            <div style={{ width: "269px" }}>
              <p className="fs14 fw700 mb-2">החנות נסגרת (שעה - HH:MM)</p>
              <select
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="form-select"
                style={{
                  padding: "8px 16px",
                  border: "1px solid #C6C6C6",
                  borderRadius: "10px",
                  width: "100%",
                  direction: "rtl",
                }}
              >
                {[...Array(24)].map((_, hour) =>
                  [...Array(4)].map((_, minute) => {
                    const time = `${hour.toString().padStart(2, "0")}:${(
                      minute * 15
                    )
                      .toString()
                      .padStart(2, "0")}`;
                    return (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          </div>

          <div className="d-flex gap-4 align-items-center">
            <div style={{ width: "150px" }}>
              <p className="fs14 fw700 mb-2">יום הפתיחה</p>
              <select
                value={openingDay}
                onChange={(e) => setOpeningDay(e.target.value)}
                className="form-select"
                style={{
                  padding: "8px 16px",
                  border: "1px solid #C6C6C6",
                  borderRadius: "10px",
                  width: "100%",
                  direction: "rtl",
                }}
              >
                <option value="Saturday">שבת</option>
                <option value="Sunday">ראשון</option>
              </select>
            </div>

            <div style={{ width: "269px" }}>
              <p className="fs14 fw700 mb-2">החנות נפתחת (שעה - HH:MM)</p>
              <select
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="form-select"
                style={{
                  padding: "8px 16px",
                  border: "1px solid #C6C6C6",
                  borderRadius: "10px",
                  width: "100%",
                  direction: "rtl",
                }}
              >
                {[...Array(24)].map((_, hour) =>
                  [...Array(4)].map((_, minute) => {
                    const time = `${hour.toString().padStart(2, "0")}:${(
                      minute * 15
                    )
                      .toString()
                      .padStart(2, "0")}`;
                    return (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          </div>
        </div>

        <div
          className="d-flex flex-column gap-4 mt-4"
          style={{ width: "489px" }}
        >
          <div>
            <p className="fs14 fw700 mb-2">העלאת קובץ</p>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile && droppedFile.size <= 5 * 1024 * 1024) {
                  // 5MB limit
                  setFile(droppedFile);
                }
              }}
              style={{
                border: "1px dashed #C6C6C6",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                height: "56px",
                cursor: "pointer",
              }}
              onClick={() => document.getElementById("fileInput").click()}
            >
              <input
                id="fileInput"
                type="file"
                style={{ display: "none" }}
                onChange={(e) => {
                  const selectedFile = e.target.files[0];
                  if (selectedFile && selectedFile.size <= 5 * 1024 * 1024) {
                    setFile(selectedFile);
                    setFileUrl(null); // Clear previous URL
                  }
                }}
                accept=".jpeg,.jpg,.pdf,.xlsx,.png"
              />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"
                  stroke="#0D0D0D"
                  strokeWidth="1.5"
                />
                <path
                  d="M12 8V16M12 8L9 11M12 8L15 11"
                  stroke="#0D0D0D"
                  strokeWidth="1.5"
                />
              </svg>
              <p
                className="fs14 fw500"
                style={{
                  color: file ? "#2C6ECB" : "#0D0D0D",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {file ? (
                  <>
                    <span>{file.name}</span>
                    <span style={{ color: "#777777" }}>
                      ({formatFileSize(file.size)})
                    </span>
                  </>
                ) : (
                  "גרור ושחרר קובץ כאן או בחר קובץ"
                )}
              </p>
            </div>
            <div className="d-flex justify-content-between mt-2">
              <p className="fs14 fw500" style={{ color: "#777777" }}>
                גודל מקסימלי: 5MB
              </p>
              <p className="fs14 fw500" style={{ color: "#777777" }}>
                קבצים נתמכים: JPEG, PDF, XLSX, PNG
              </p>
            </div>
          </div>
        </div>

        <div
          className="d-flex flex-column gap-4 mt-4"
          style={{ width: "486px" }}
        >
          <div>
            <p className="fs14 fw700">לינקים לרשתות חברתיות:</p>

            {socialLinks.map((link, index) => (
              <div
                key={index}
                className="d-flex flex-row-reverse justify-content-end align-items-center gap-2 mt-2"
              >
                <div className="d-flex gap-2">
                  <button
                    onClick={() => setCurrentLink(link)}
                    style={{
                      height: "36px",
                      background: "#FBB105",
                      borderRadius: "10px",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="16"
                      height="17"
                      viewBox="0 0 16 17"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9.38214 3.08997C9.87894 2.55173 10.1273 2.28261 10.3913 2.12563C11.0281 1.74685 11.8124 1.73507 12.4599 2.09455C12.7283 2.24354 12.9843 2.50509 13.4963 3.02818C14.0084 3.55127 14.2645 3.81282 14.4103 4.08696C14.7622 4.74842 14.7507 5.54953 14.3799 6.20014C14.2262 6.46978 13.9627 6.72353 13.4359 7.23101L7.16674 13.2692C6.16826 14.2309 5.66901 14.7118 5.04505 14.9555C4.42109 15.1992 3.73514 15.1813 2.36325 15.1454L2.1766 15.1405C1.75895 15.1296 1.55012 15.1241 1.42874 14.9863C1.30734 14.8486 1.32392 14.6359 1.35706 14.2105L1.37506 13.9795C1.46835 12.782 1.51499 12.1833 1.74882 11.6451C1.98264 11.1069 2.38597 10.67 3.19263 9.79601L9.38214 3.08997Z"
                        stroke="#0D0D0D"
                        stroke-width="1.5"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M8.66699 3.16699L13.3337 7.83366"
                        stroke="#0D0D0D"
                        stroke-width="1.5"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M9.33301 15.167H14.6663"
                        stroke="#0D0D0D"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => {
                      const newLinks = [...socialLinks];
                      newLinks.splice(index, 1);
                      setSocialLinks(newLinks);
                    }}
                    style={{
                      height: "36px",
                      background: "#BE0A19",
                      borderRadius: "10px",
                      border: "none",

                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.3337 3.99996H2.66699"
                        stroke="#FBFBFB"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M6.66699 6.66663V11.3333"
                        stroke="#FBFBFB"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M9.33301 6.66663V11.3333"
                        stroke="#FBFBFB"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M12 3.99996L11.2807 12.5333C11.2807 12.8 11.1474 13.0666 10.9474 13.2666C10.7474 13.4666 10.4807 13.6 10.214 13.6H5.78737C5.52071 13.6 5.25404 13.4666 5.05404 13.2666C4.85404 13.0666 4.72071 12.8 4.72071 12.5333L4 3.99996"
                        stroke="#FBFBFB"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>

                <input
                  type="text"
                  value={link}
                  onChange={(e) => {
                    const newLinks = [...socialLinks];
                    newLinks[index] = e.target.value;
                    setSocialLinks(newLinks);
                  }}
                  placeholder={`לינק ${index + 1}`}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #C6C6C6",
                    borderRadius: "10px",
                    width: "398px",
                    height: "37px",
                    direction: "rtl",
                    fontSize: "14px",
                    fontFamily: "Inter",
                    fontWeight: "500",
                    color: "#777777",
                  }}
                />
              </div>
            ))}

            <button
              onClick={() => setSocialLinks([...socialLinks, ""])}
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                padding: "8px 24px",
                gap: "10px",
                width: "250px",
                height: "37px",
                background: "#FBB105",
                borderRadius: "24px",
                border: "none",
                marginTop: "16px",
                cursor: "pointer",
                fontSize: "14px",
                fontFamily: "Inter",
                fontWeight: "500",
                color: "#0D0D0D",
              }}
            >
              הוסף קישור לרשתות חברתיות
            </button>
          </div>
        </div>

        <div
          className="d-flex flex-column gap-4 mt-4"
          style={{ width: "486px" }}
        >
          <div>
            <p className="fs14 fw700 mb-2">טקסט באנר</p>
            <input
              type="text"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
              placeholder="היי, שיהיה לכם שבת שלום! נראה אתכם אחרי צאת שבת"
              style={{
                padding: "8px 16px",
                border: "1px solid #C6C6C6",
                borderRadius: "10px",
                width: "488px",
                height: "37px",
                direction: "rtl",
                fontSize: "14px",
                fontFamily: "Inter",
                fontWeight: "500",
                lineHeight: "21px",
                color: "#777777",
                "::placeholder": {
                  color: "#777777",
                  fontSize: "14px",
                  fontWeight: "500",
                },
              }}
            />

            <div className="color-pickers-container mt-4">
              <p className="fw700 fs14 mb-3">צבעי באנר:</p>
              <div className="d-flex gap-1 flex-wrap">
                <div className="color-picker-group rtl">
                  <label
                    htmlFor="bannerBgColor"
                    className="form-label fs14 mb-2"
                  >
                    צבע רקע
                  </label>
                  <div className="color-picker-wrapper">
                    <span className="color-value">
                      {bannerBgColor.toUpperCase()}
                    </span>
                    <input
                      type="color"
                      className="form-control form-control-color"
                      id="bannerBgColor"
                      name="bannerBgColor"
                      value={bannerBgColor}
                      onChange={(e) => setBannerBgColor(e.target.value)}
                      title="בחר צבע רקע"
                    />
                  </div>
                </div>

                <div className="color-picker-group rtl">
                  <label
                    htmlFor="bannerTextColor"
                    className="form-label fs14 mb-2"
                  >
                    צבע טקסט
                  </label>
                  <div className="color-picker-wrapper">
                    <span className="color-value">
                      {bannerTextColor.toUpperCase()}
                    </span>
                    <input
                      type="color"
                      className="form-control form-control-color"
                      id="bannerTextColor"
                      name="bannerTextColor"
                      value={bannerTextColor}
                      onChange={(e) => setBannerTextColor(e.target.value)}
                      title="בחר צבע טקסט"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-end gap-4 mt-4">
          <div className="d-flex gap-4 rtl">
            <button
              onClick={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                padding: "8px 24px",
                gap: "10px",
                width: "79px",
                height: "37px",
                background: "#FBB105",
                borderRadius: "24px",
                border: "none",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontFamily: "Inter",
                fontWeight: "500",
                color: "#0D0D0D",
                opacity: isSubmitting ? 0.7 : 1,
              }}
              disabled={isSubmitting}
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
            </button>

            <button
              onClick={handlePreview}
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                padding: "8px 24px",
                gap: "10px",
                width: "146px",
                height: "37px",
                background: "#021341",
                borderRadius: "24px",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontFamily: "Inter",
                fontWeight: "500",
                color: "#FBFBFB",
              }}
            >
              תצוגה מקדימה
            </button>
          </div>
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

        {showPreview && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "90%",
                maxHeight: "90vh",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  position: "absolute",
                  top: "-40px",
                  right: "0",
                  background: "none",
                  border: "none",
                  color: "#FBFBFB",
                  cursor: "pointer",
                  fontSize: "24px",
                }}
              >
                ✕
              </button>
              <SabbathPreview
                bannerText={bannerText}
                bannerBgColor={bannerBgColor}
                bannerTextColor={bannerTextColor}
                socialLinks={socialLinks}
                imageUrl={fileUrl} // Use fileUrl instead of selectedFile
                openingDay={openingDay}
                openingTime={openingTime}
                storeName={user?.shop?.replace(".myshopify.com", "")} // Format shop name
                onClose={() => setShowPreview(false)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="steps">
        <h4>שלבים:</h4>

        {[
          "שלב 1 - התחל בהפעלה או כיבוי של מצב שבת בהתאם להעדפותיך. אם תרצה שמצב זה יופעל אוטומטית בכל שבוע, הפעל את הפעל מצב שבת באופן אוטומטי כך שהחנות שלך תיסגר ותפתח מחדש בזמנים שתקבע.",
          "שלב 2 - בחר את הזמנים הספציפיים שבהם החנות שלך תיסגר ותפתח מחדש בכל שבת. זה מבטיח שהחנות שלך משקפת את השעות הנכונות באופן אוטומטי, כך שלא תצטרך להתאים אותה מדי שבוע.",
          "שלב 3 - צור הודעה מותאמת אישית שתוצג ללקוחות כשהחנות שלך במצב שבת, תודיע להם מתי תחזור או תספק מידע נוסף.",
          "שלב 4 - הוסף קישורים שבהם לקוחות יכולים להגיע אליך במהלך מצב השבת במידת הצורך, כגון דף יצירת קשר חלופי או אפשרות תמיכה.",
          "שלב 5 - בחר צבעי רקע וטקסט עבור הבאנר של מצב שבת כדי להתאים לסגנון החנות שלך, ולאחר מכן לחץ על שמור כדי להחיל את כל ההגדרות שלך.",
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
