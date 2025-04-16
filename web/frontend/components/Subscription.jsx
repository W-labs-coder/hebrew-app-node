import React, { useState, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge-utils";
import { Redirect } from "@shopify/app-bridge/actions";


const Subscription = ({ subscriptions }) => {
  const app = useAppBridge();
  const [planType, setPlanType] = useState("monthly");
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selected, setSelected] = useState(null)

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
      <div>
        <p className="fs32 fw600 text-center mb-0" style={{ color: "#0D0D0D" }}>
          הפתרון המושלם לחנויות בעברית
        </p>
        <p style={{ color: "#777777" }} className="fs14 text-center">
          האפליקציה שתהפוך את החנות שלך למותאמת לעברית בצורה מקצועית ומהירה
        </p>
      </div>

      <div className="d-lg-flex jcb aic mt-3">
        <div>
          <p className="fw600 fs18" style={{ color: "#0D0D0D" }}>
            החבילות שלנו
          </p>
        </div>
        <div className="d-flex aic gap-4">
          <div>
            <p>תקופת חיוב</p>
          </div>
          <div
            id="toggleContainer"
            style={{
              background: "#E1E1E1",
              height: "45px",
              borderRadius: "12px",
              padding: "4px 16px 4px 4px",
              cursor: "pointer",
            }}
            className="d-flex aic gap-4"
          >
            <div
              id="yearly"
              className={`d-flex aic gap-4 ${
                planType === "yearly" ? "active" : ""
              }`}
              style={{
                background: planType === "yearly" ? "#FBFBFB" : "",
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
            <div
              id="monthly"
              className={`d-flex aic jcc ${
                planType === "monthly" ? "active" : ""
              }`}
              style={{
                background: planType === "monthly" ? "#FBFBFB" : "",
                boxShadow: "0px 1px 4px -2px #00000021",
                borderRadius: "8px",
                height: "37px",
                width: "115px",
                cursor: "pointer",
              }}
              onClick={() => handlePlanChange("monthly")}
            >
              <p className="fs14">חודשי</p>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          border: "1px solid #C6C6C6",
          borderRadius: "12px",
          marginTop: "24px",
          background: "#FBFBFB",
        }}
      >
        <div className="d-lg-flex flex-wrap ais my-3 jcc px-2">
          {filteredSubscriptions.map((subscription) => (
            <div
              key={subscription._id}
              className="col-lg-3 col-md-3 col-sm-12 m-3"
              style={{
                background:
                  subscription.name.toLowerCase() === "pro"
                    ? "#FBB105"
                    : "#C6C6C6",
                borderRadius: "12px",
                cursor: "pointer",
                flexGrow: 1
              }}
            >
              <p className="fs14 text-center" style={{ padding: "10px 26px" }}>
                {subscription.name.toLowerCase() === "pro" ? "הכי פופולרי" : ""}
              </p>
              <div
                style={{
                  background: "#FBFBFB",
                  borderRadius: "12px",
                  padding: "16px",
                  margin: "1px",
                  gap: "10px",
                }}
                className="d-flex jcs flex-column"
              >
                <div>
                  <p className="fs14">{subscription.name}</p>
                </div>
                <div className="d-flex jcb aie">
                  <p className="fw600 fs32">${subscription.amount}</p>
                  <p className="fs14" style={{ color: "#777777" }}>
                    חיוב מדי{" "}
                    {subscription.duration === "monthly" ? "חודש" : "שנה"}
                  </p>
                </div>
                <div
                  style={{
                    border: "1px solid #FBB105",
                    padding: "24px 8px",
                    borderRadius: "36px",
                    height: "37px",
                    background:
                      subscription.name.toLowerCase() === "pro"
                        ? "#FBB105"
                        : "transparent",
                  }}
                  className="d-flex aic jcc subscribe-button"
                  onClick={() => handleSelectPlan(subscription._id)}
                >
                  {!loading ? (
                    <p className="fs14 text-center">
                      התחל ניסיון של 8 ימים בחינם
                    </p>
                  ) : (
                    selected == subscription?._id && (
                      <p className="fs14 text-center">Loading... Please wait</p>
                    )
                  )}
                </div>
                <p className="fw600 fs16">{subscription.name} Plan</p>

                {subscription.features.map((feature, index) => (
                  <div key={index} className="d-flex aic gap-2">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 22 22"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M11.0572 0.75H11.0572C13.2479 0.749987 14.9686 0.749977 16.312 0.930594C17.6886 1.11568 18.7809 1.50272 19.6391 2.36091C20.4973 3.21911 20.8843 4.31137 21.0694 5.68802C21.25 7.03144 21.25 8.75214 21.25 10.9428V11.0572C21.25 13.2479 21.25 14.9686 21.0694 16.312C20.8843 17.6886 20.4973 18.7809 19.6391 19.6391C18.7809 20.4973 17.6886 20.8843 16.312 21.0694C14.9686 21.25 13.2479 21.25 11.0572 21.25H10.9428C8.7521 21.25 7.03144 21.25 5.68802 21.0694C4.31137 20.8843 3.21911 20.4973 2.36091 19.6391C1.50272 18.7809 1.11568 17.6886 0.930594 16.312C0.749977 14.9686 0.749987 13.2479 0.75 11.0572V11.0572V10.9428V10.9428C0.749987 8.75211 0.749977 7.03144 0.930594 5.68802C1.11568 4.31137 1.50272 3.21911 2.36091 2.36091C3.21911 1.50272 4.31137 1.11568 5.68802 0.930594C7.03144 0.749977 8.75212 0.749987 10.9428 0.75H10.9428H11.0572ZM15.6757 7.26285C16.0828 7.63604 16.1103 8.26861 15.7372 8.67573L10.2372 14.6757C10.0528 14.8768 9.79441 14.9938 9.52172 14.9998C9.24903 15.0057 8.98576 14.9 8.79289 14.7071L6.29289 12.2071C5.90237 11.8166 5.90237 11.1834 6.29289 10.7929C6.68342 10.4024 7.31658 10.4024 7.70711 10.7929L9.46859 12.5544L14.2628 7.32428C14.636 6.91716 15.2686 6.88966 15.6757 7.26285Z"
                        fill="#0D0D0D"
                      />
                    </svg>
                    <p className="fs14" style={{ color: "#777777" }}>
                      {feature}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {successMessage && (
        <div className="alert alert-info mt-3">{successMessage}</div>
      )}
    </div>
  );
};

export default Subscription;
