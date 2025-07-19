import React, { useState, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge-utils";
import { Redirect } from "@shopify/app-bridge/actions";
import { useSelector } from "react-redux";

const Subscription = ({ subscriptions }) => {
  const app = useAppBridge();
  const [planType, setPlanType] = useState("monthly");
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selected, setSelected] = useState(null)
  
  const userSubscription = useSelector(state => state.auth.subscription?.subscription); 

  console.log("userSubscription", userSubscription);

  useEffect(() => {
    const updatedSubscriptions = subscriptions.filter(
      (subscription) => subscription.duration === planType
    );
    setFilteredSubscriptions(updatedSubscriptions);
  }, [planType, subscriptions]);

  const handlePlanChange = (type) => {
    setPlanType(type);
  };

  const handleSelectPlan = async (id) => {
    setLoading(true)
    setSelected(id);
    try {
      const response = await fetch("/api/billing/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionId: id }),
      });

      const data = await response.json();
      if (data.success && data.confirmationUrl) {
        // Redirect to Shopify's test billing page
        window.top.location.href = data.confirmationUrl;
      } else {
        console.error("Error creating subscription:", data.errors);
        // Handle error (show message to user, etc.)
      }
    } catch (error) {
      console.error("Failed to create subscription:", error);
      // Handle error
    }finally{
      setLoading(false);
    }
  };

  useEffect(() => {
    if (successMessage) {
      const timeout = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timeout);
    }
  }, [successMessage]);

  return (
    <div className="">
      {/* Header Section */}
      <div>
        <p className="fs32 fw600 text-center mb-0" style={{ color: "#0D0D0D" }}>
          הפתרון המושלם לחנויות בעברית
        </p>
        <p style={{ color: "#777777" }} className="fs14 text-center">
          האפליקציה שתהפוך את החנות שלך למותאמת לעברית בצורה מקצועית ומהירה
        </p>
      </div>

      {/* Toggle Button - Top Center */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '40px',
        marginBottom: '40px'
      }}>
        <div style={{
          background: "#E1E1E1",
          height: "45px",
          borderRadius: "12px",
          padding: "4px 16px 4px 4px",
          display: "flex",
          alignItems: "center",
          gap: "4px"
        }}>
          <div
            style={{
              background: planType === "monthly" ? "#FBFBFB" : "",
              padding: "2px 8px",
              boxShadow: "0px 1px 4px -2px #00000021",
              borderRadius: "8px",
              height: "37px",
              width: "115px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onClick={() => handlePlanChange("monthly")}
          >
            <p className="fs14">חודשי</p>
          </div>
          <div
            style={{
              background: planType === "yearly" ? "#FBFBFB" : "",
              padding: "2px 8px",
              boxShadow: "0px 1px 4px -2px #00000021",
              borderRadius: "8px",
              height: "37px",
              width: "150px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
            onClick={() => handlePlanChange("yearly")}
          >
            <p
              className="fs14"
              style={{
                background: "#FBB105",
                boxShadow: "0px 1px 4px -2px #00000021",
                borderRadius: "8px",
                padding: "2px 8px",
              }}
            >
              חסוך 20%
            </p>
            <p style={{ color: "#777777" }} className="fs14">
              שנתי
            </p>
          </div>
        </div>
      </div>

      {/* Plan Cards Container */}
      <div style={{
        display: "flex",
        gap: "20px",
        justifyContent: "center",
        flexWrap: "nowrap",
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        {filteredSubscriptions
          ?.slice()
          ?.sort((a, b) => {
            const order = ["Basic", "Pro", "Premium"];
            return order.indexOf(a.name) - order.indexOf(b.name);
          })
          .map((subscription) => (
            <div
              key={subscription._id}
              style={{
                flex: "1",
                minWidth: "300px",
                maxWidth: "350px",
                background: "#FBFBFB",
                border: "1px solid #C6C6C6",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                height: "500px" // Fixed height for all cards
              }}
            >
              {/* Popular Badge for Pro */}
              {subscription.name.toLowerCase() === "pro" && (
                <div style={{
                  background: "#FBB105",
                  color: "white",
                  textAlign: "center",
                  padding: "10px",
                  borderRadius: "12px 12px 0 0",
                  fontSize: "14px",
                  fontWeight: "bold"
                }}>
                  הכי פופולרי
                </div>
              )}

              {/* Card Content */}
              <div style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                flex: "1",
                justifyContent: "space-between"
              }}>
                {/* Header */}
                <div>
                  <h3 style={{
                    margin: "0 0 8px 0",
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#0D0D0D"
                  }}>
                    {subscription.name}
                  </h3>
                </div>

                {/* Price Section */}
                <div style={{ marginBottom: "20px" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "8px",
                    marginBottom: "8px"
                  }}>
                    <span style={{
                      fontSize: "32px",
                      fontWeight: "bold",
                      color: "#0D0D0D"
                    }}>
                      ${subscription.amount}
                    </span>
                    <span style={{
                      fontSize: "14px",
                      color: "#777777"
                    }}>
                      {planType === "monthly" ? "לחודש" : "לשנה"}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div style={{
                  flex: "1",
                  marginBottom: "20px"
                }}>
                  {subscription.features.map((feature, index) => (
                    <div key={index} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "12px"
                    }}>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 22 22"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M11.0572 0.75H11.0572C13.2479 0.749987 14.9686 0.749977 16.312 0.930594C17.6886 1.11568 18.7809 1.50272 19.6391 2.36091C20.4973 3.21911 20.8843 4.31137 21.0694 5.68802C21.25 7.03144 21.25 8.75214 21.25 10.9428V11.0572C21.25 13.2479 21.25 14.9686 21.0694 16.312C20.8843 17.6886 20.4973 18.7809 19.6391 19.6391C18.7809 20.4973 17.6886 20.8843 16.312 21.0694C14.9686 21.25 13.2479 21.25 11.0572 21.25H10.9428C8.7521 21.25 7.03144 21.25 5.68802 21.0694C4.31137 20.8843 3.21911 20.4973 2.36091 19.6391C1.50272 18.7809 1.11568 17.6886 0.930594 16.312C0.749977 14.9686 0.749987 13.2479 0.75 11.0572V11.0572V10.9428V10.9428C0.749987 8.75211 0.749977 7.03144 0.930594 5.68802C1.11568 4.31137 1.50272 3.21911 2.36091 2.36091C3.21911 1.50272 4.31137 1.11568 5.68802 0.930594C7.03144 0.749977 8.75212 0.749987 10.9428 0.75H10.9428H11.0572ZM15.6757 7.26285C16.0828 7.63604 16.1103 8.26861 15.7372 8.67573L10.2372 14.6757C10.0528 14.8768 9.79441 14.9938 9.52172 14.9998C9.24903 15.0057 8.98576 14.9 8.79289 14.7071L6.29289 12.2071C5.90237 11.8166 5.90237 11.1834 6.29289 10.7929C6.68342 10.4024 7.31658 10.4024 7.70711 10.7929L9.46859 12.5544L14.2628 7.32428C14.636 6.91716 15.2686 6.88966 15.6757 7.26285Z"
                          fill="#0D0D0D"
                        />
                      </svg>
                      <span style={{
                        fontSize: "14px",
                        color: "#777777"
                      }}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Button at Bottom */}
                <div style={{
                  marginTop: "auto"
                }}>
                  <button
                    onClick={() =>
                      subscription._id != userSubscription?._id &&
                      handleSelectPlan(subscription._id)
                    }
                    disabled={loading && selected === subscription._id}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #FBB105",
                      borderRadius: "36px",
                      background: subscription.name.toLowerCase() === "pro" ? "#FBB105" : "transparent",
                      color: subscription.name.toLowerCase() === "pro" ? "white" : "#0D0D0D",
                      fontSize: "14px",
                      fontWeight: "bold",
                      cursor: subscription._id == userSubscription?._id ? "default" : "pointer",
                      opacity: subscription._id == userSubscription?._id ? 0.6 : 1,
                      transition: "all 0.3s ease"
                    }}
                  >
                    {subscription._id == userSubscription?._id ? (
                      "פעיל"
                    ) : selected === subscription._id && loading ? (
                      "Loading... Please wait"
                    ) : (
                      "התחל ניסיון של 8 ימים בחינם"
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {successMessage && (
        <div className="alert alert-info mt-3">{successMessage}</div>
      )}
    </div>
  );
};

export default Subscription;