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
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation, Trans } from "react-i18next";
import { Redirect } from "@shopify/app-bridge/actions";

import { trophyImage } from "../assets";
import { ProductsCard } from "../components";
import Subscription from "../components/Subscription";
import { getSessionToken } from "@shopify/app-bridge-utils";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";


export default function HomePage() {
  const { t } = useTranslation();
  const app = useAppBridge();
  const redirect = Redirect.create(app);

  const authenticatedFetch = useAuthenticatedFetch();
  const [subscriptions, setSubscriptions] = useState([]);
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
    checkSubscription();
    fetchSubscriptions();
  }, []);

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

        if (data) {
            window.location.href = "/dashboard";
        }
      } else {
        console.error("Failed to fetch subscriptions");
      }
    } catch (error) {
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

  return (
    <Page fullWidth>
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
