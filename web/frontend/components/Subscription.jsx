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
        <div className="row ais my-3 jcc">
          {filteredSubscriptions.map((subscription) => (
            <div
              key={subscription._id}
              className="col-lg-3 col-md-3 col-sm-12 m-3 p-0"
              style={{
                background:
                  subscription.name.toLowerCase() === "pro"
                    ? "#FBB105"
                    : "#C6C6C6",
                borderRadius: "12px",
                cursor: "pointer",
              }}
            >
              <p className="fs14 text-center" style={{ padding: "26px 0px" }}>
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
                  {!loading ? <p className="fs14 text-center">
                    התחל ניסיון של 8 ימים בחינם
                  </p> : ( selected == subscription?._id && <p className="fs14 text-center">Loading... Please wait</p>)}
                </div>
                <p className="fw600 fs16">{subscription.name} Plan</p>

                {subscription.features.map((feature, index) => (
                  <div key={index} className="d-flex aic gap-2">
                    <img src="/svgs/check-svg" alt="" />
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
