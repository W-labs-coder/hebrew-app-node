import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Page,
  Layout,
  TextContainer,
  Image,
  Stack,
  Link,
  Text,
  LegacyCard,
  Spinner,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation, Trans } from "react-i18next";
import { Redirect } from "@shopify/app-bridge/actions";

import { trophyImage } from "../assets";
import { ProductsCard } from "../components";
import Subscription from "../components/Subscription";
import { getSessionToken } from "@shopify/app-bridge-utils";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import {useNavigate} from 'react-router-dom'

export default function HomePage() {
  const { t } = useTranslation();
  const app = useAppBridge();
  const redirect = Redirect.create(app);
  const navigate = useNavigate();
  const authenticatedFetch = useAuthenticatedFetch();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true); // <-- Add loading state
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
    generateLanguage();
    checkSubscription();
    fetchSubscriptions();
    // eslint-disable-next-line
  }, []);

  const generateLanguage = async () => {
    try {
      const response = await fetch("/api/settings/generate-selected-language", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        // const data = await response.json();
        // if (data.subscription) {
        //   navigate("dashboard");
        // } else {
        //   setLoading(false); // <-- Only stop loading if no subscription
        // }

        console.log('generated all themes translations')
        // downloadTranslations();
      } else {
        setLoading(false);
        console.error("Failed to fetch subscriptions");
      }
    } catch (error) {
      setLoading(false);
      console.error("Error fetching subscriptions:", error);
    }
  };

  const downloadTranslations = async () => {
    try {
      const response = await fetch("/api/settings/download-translations", {
        method: "GET",
      });
      
      if (response.ok) {
        // Get the blob from the response
        const blob = await response.blob();
        
        // Create a URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary anchor element
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'translations.zip';
        
        // Append to the document body
        document.body.appendChild(a);
        
        // Trigger click event
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('Downloaded translations successfully');
      } else {
        console.error("Failed to download translations");
      }
    } catch (error) {
      console.error("Error downloading translations:", error);
    }
  };

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
        if (data.subscription) {
          navigate("dashboard");
        } else {
          setLoading(false); // <-- Only stop loading if no subscription
        }
      } else {
        setLoading(false);
        console.error("Failed to fetch subscriptions");
      }
    } catch (error) {
      setLoading(false);
      console.error("Error fetching subscriptions:", error);
    }
  };

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

  if (loading) {
    return (
      <Page fullWidth>
        <Layout>
          <Layout.Section>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
              <Spinner accessibilityLabel="Loading" size="large" />
            </div>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <LegacyCard sectioned>
            <Subscription
              subscriptions={subscriptions}
              app={app}
              onRedirect={handleRedirect}
            />
          </LegacyCard>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
