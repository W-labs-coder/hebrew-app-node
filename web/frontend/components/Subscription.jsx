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

  // Get plan descriptions
  const getPlanDescription = (planName) => {
    switch(planName.toLowerCase()) {
      case 'premium':
        return 'חבילה לחנות מתקדמות ביתר';
      case 'pro':
        return 'חבילה לחנויות מתקדמות';
      case 'basic':
        return 'החבילה הבסיסית, מתאימה לרוב החברות';
      default:
        return '';
    }
  };

  // Get plan prices based on duration
  const getPlanPrice = (planName) => {
    const plan = filteredSubscriptions.find(sub => sub.name === planName);
    return plan ? plan.amount : 0;
  };

  // Get plan features
  const getPlanFeatures = (planName) => {
    const plan = filteredSubscriptions.find(sub => sub.name === planName);
    return plan ? plan.features : [];
  };

  return (
    <div style={{ 
      background: '#f5f5f5', 
      minHeight: '100vh', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Main white card container */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '1400px',
        margin: '0 auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        
        {/* Billing Frequency Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '40px'
        }}>
          <div style={{
            background: '#e0e0e0',
            borderRadius: '25px',
            padding: '4px',
            display: 'flex',
            position: 'relative',
            width: '200px',
            height: '40px'
          }}>
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: planType === 'monthly' ? '2px' : '102px',
                width: '96px',
                height: '36px',
                background: '#007bff',
                borderRadius: '18px',
                transition: 'left 0.3s ease',
                zIndex: 1
              }}
            />
            <button
              onClick={() => handlePlanChange('monthly')}
              style={{
                width: '96px',
                height: '36px',
                border: 'none',
                background: 'transparent',
                color: planType === 'monthly' ? 'white' : '#666',
                borderRadius: '18px',
                cursor: 'pointer',
                fontWeight: 'bold',
                position: 'relative',
                zIndex: 2
              }}
            >
              חודשי
            </button>
            <button
              onClick={() => handlePlanChange('yearly')}
              style={{
                width: '96px',
                height: '36px',
                border: 'none',
                background: 'transparent',
                color: planType === 'yearly' ? 'white' : '#666',
                borderRadius: '18px',
                cursor: 'pointer',
                fontWeight: 'bold',
                position: 'relative',
                zIndex: 2
              }}
            >
              שנתי
            </button>
          </div>
        </div>

        {/* Plan Cards Container - Fixed to ensure horizontal layout */}
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          overflowX: 'auto'
        }}>
          
          {/* Premium Plan */}
          <div style={{
            flex: '1',
            minWidth: '320px',
            maxWidth: '380px',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            overflow: 'hidden',
            background: 'white',
            flexShrink: 0
          }}>
            {/* Header */}
            <div style={{
              background: '#007bff',
              color: 'white',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>Premium</h3>
              <p style={{ margin: '0', fontSize: '14px', opacity: '0.9' }}>
                {getPlanDescription('Premium')}
              </p>
            </div>
            
            {/* Content */}
            <div style={{ padding: '24px' }}>
              {/* Price */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
                    ${getPlanPrice('Premium')}
                  </span>
                  <span style={{ fontSize: '16px', color: '#666' }}>
                    {planType === 'monthly' ? 'לחודש' : 'לשנה'}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div style={{ marginBottom: '24px' }}>
                {getPlanFeatures('Premium').map((feature, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: '#28a745',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                    </div>
                    <span style={{ fontSize: '14px', color: '#333' }}>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Button */}
              <button
                onClick={() => handleSelectPlan(filteredSubscriptions.find(s => s.name === 'Premium')?._id)}
                disabled={loading && selected === filteredSubscriptions.find(s => s.name === 'Premium')?._id}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading && selected === filteredSubscriptions.find(s => s.name === 'Premium')?._id 
                  ? 'טוען...' 
                  : 'הפעלת חבילה'
                }
              </button>
            </div>
          </div>

          {/* Pro Plan */}
          <div style={{
            flex: '1',
            minWidth: '320px',
            maxWidth: '380px',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            overflow: 'hidden',
            background: 'white',
            flexShrink: 0
          }}>
            {/* Header */}
            <div style={{
              background: '#007bff',
              color: 'white',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>Pro</h3>
              <p style={{ margin: '0', fontSize: '14px', opacity: '0.9' }}>
                {getPlanDescription('Pro')}
              </p>
            </div>
            
            {/* Content */}
            <div style={{ padding: '24px' }}>
              {/* Price */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
                    ${getPlanPrice('Pro')}
                  </span>
                  <span style={{ fontSize: '16px', color: '#666' }}>
                    {planType === 'monthly' ? 'לחודש' : 'לשנה'}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div style={{ marginBottom: '24px' }}>
                {getPlanFeatures('Pro').map((feature, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: '#28a745',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                    </div>
                    <span style={{ fontSize: '14px', color: '#333' }}>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Button */}
              <button
                onClick={() => handleSelectPlan(filteredSubscriptions.find(s => s.name === 'Pro')?._id)}
                disabled={loading && selected === filteredSubscriptions.find(s => s.name === 'Pro')?._id}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading && selected === filteredSubscriptions.find(s => s.name === 'Pro')?._id 
                  ? 'טוען...' 
                  : 'הפעלת חבילה'
                }
              </button>
            </div>
          </div>

          {/* Basic Plan */}
          <div style={{
            flex: '1',
            minWidth: '320px',
            maxWidth: '380px',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            overflow: 'hidden',
            background: 'white',
            flexShrink: 0
          }}>
            {/* Header */}
            <div style={{
              background: '#007bff',
              color: 'white',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>Basic</h3>
              <p style={{ margin: '0', fontSize: '14px', opacity: '0.9' }}>
                {getPlanDescription('Basic')}
              </p>
            </div>
            
            {/* Content */}
            <div style={{ padding: '24px' }}>
              {/* Price */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
                    ${getPlanPrice('Basic')}
                  </span>
                  <span style={{ fontSize: '16px', color: '#666' }}>
                    {planType === 'monthly' ? 'לחודש' : 'לשנה'}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div style={{ marginBottom: '24px' }}>
                {getPlanFeatures('Basic').map((feature, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: '#28a745',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                    </div>
                    <span style={{ fontSize: '14px', color: '#333' }}>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Button */}
              <button
                onClick={() => handleSelectPlan(filteredSubscriptions.find(s => s.name === 'Basic')?._id)}
                disabled={loading && selected === filteredSubscriptions.find(s => s.name === 'Basic')?._id}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading && selected === filteredSubscriptions.find(s => s.name === 'Basic')?._id 
                  ? 'טוען...' 
                  : 'ביטול חבילה'
                }
              </button>
            </div>
          </div>

        </div>

        {successMessage && (
          <div className="alert alert-info mt-3">{successMessage}</div>
        )}
      </div>
    </div>
  );
};

export default Subscription;