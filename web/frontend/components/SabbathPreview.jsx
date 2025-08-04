import React, { useEffect, useState } from "react";

const SabbathPreview = ({
  bannerText,
  bannerBgColor,
  bannerTextColor,
  socialLinks,
  imageUrl,
  openingDay,
  openingTime,
  storeName,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const [hour, minute] = openingTime?.split(":" ).map(Number) || [0, 0];

      const nextOpening = new Date();
      nextOpening.setDate(now.getDate() + ((7 + getDayIndex(openingDay) - now.getDay()) % 7));
      nextOpening.setHours(hour, minute, 0, 0);

      const diff = nextOpening - now;

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [openingDay, openingTime]);

  const getDayIndex = (day) => {
    const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    return days.indexOf(day);
  };

  return (
    <div
    style={{
      background: "#fff",
      padding: "2rem",
      maxWidth: "500px",
      width: "90%",
      textAlign: "center",
      borderRadius: "12px",
      fontFamily: "'Arial', sans-serif",
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 1000,
      boxShadow: "0 0 20px rgba(0,0,0,0.2)",
    }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          fontSize: "1.5rem",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        ✕
      </button>

      {/* Header */}
      <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem", fontWeight: "bold" }}>
        THANK <span style={{ color: "red" }}>🙏 YOU</span>
      </h2>

      {/* Main Message */}
      <p style={{ fontSize: "1.25rem", margin: "0.5rem 0" }}>שבת שלום.</p>
      <p style={{ fontSize: "1.25rem", margin: "0.5rem 0" }}>החנות סגורה כעת.</p>
      <p style={{ fontSize: "1rem", marginTop: "1.5rem" }}>
        נחזור לפעילות במוצ"ש בעוד:
      </p>

      {/* Countdown */}
      <div style={{ fontSize: "2.5rem", fontWeight: "bold", margin: "1rem 0" }}>
        {String(timeLeft.hours).padStart(2, "0")}:
        {String(timeLeft.minutes).padStart(2, "0")}:
        {String(timeLeft.seconds).padStart(2, "0")}
      </div>

      {/* Time Labels */}
      <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1.5rem" }}>
        <span style={{ margin: "0 8px" }}>שעות</span>
        <span style={{ margin: "0 8px" }}>דקות</span>
        <span style={{ margin: "0 8px" }}>שניות</span>
      </div>

      {/* Contact & Social */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <a href="#" style={{ textDecoration: "underline", color: "#000" }}>
          צור קשר
        </a>
        {Array.isArray(socialLinks) &&
          socialLinks.map((link, idx) => {
            if (!link?.name || !link?.url) return null;

            try {
              const iconName = link.name.toLowerCase();
              const iconUrl = getSocialIcon(iconName);

              return (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ margin: "0 0.5rem" }}
                >
                  <img
                    src={iconUrl}
                    alt={link.name}
                    style={{ width: "24px", height: "24px" }}
                  />
                </a>
              );
            } catch (e) {
              return null;
            }
          })}
      </div>

      {/* Note */}
      <p style={{ fontSize: "0.75rem", color: "#999" }}>
        *החנות תפתח ביום שבת בשעה {openingTime}
      </p>
    </div>
  );
};

const getSocialIcon = (name) => {
  switch (name) {
    case "facebook":
      return "https://cdn-icons-png.flaticon.com/512/124/124010.png";
    case "instagram":
      return "https://cdn-icons-png.flaticon.com/512/2111/2111463.png";
    case "tiktok":
      return "https://cdn-icons-png.flaticon.com/512/3046/3046122.png";
    default:
      return "https://cdn-icons-png.flaticon.com/512/25/25694.png"; // default icon
  }
};

export default SabbathPreview;