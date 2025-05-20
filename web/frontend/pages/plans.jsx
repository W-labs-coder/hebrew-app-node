import React, { useEffect, useMemo, useState } from "react";
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
import HomePage from ".";
import Subscription from "../components/Subscription";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";

export default function Plans() {
const app = useAppBridge();
const [subscriptions, setSubscriptions] = useState([]);
const redirect = Redirect.create(app);


    const appBridge = useAppBridge();
    
      const shopify = useMemo(() => {
        if (appBridge) {
          return {
            ...appBridge,
            navigate: Redirect.create(appBridge),
          };
        }
        return null;
      }, [appBridge]);
    
      useEffect(() => {
        fetchSubscriptions();
        // eslint-disable-next-line
      }, []);


  const fetchSubscriptions = async () => {
      try {
        const response = await fetch("/api/billing/fetch-subscription", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setSubscriptions(data);
        } else {
          console.error("Failed to fetch subscriptions");
        }
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      }
    };
  
    const handleRedirect = (url) => {
      redirect.dispatch(Redirect.Action.APP, url);
    };

 

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Page >
          <Layout>
            <Layout.Section>
              <div>
                 <Subscription
                              subscriptions={subscriptions}
                              app={app}
                              onRedirect={handleRedirect}
                            />
              </div>
            </Layout.Section>
          </Layout>
        </Page>
      </div>
    </div>
  );
}
