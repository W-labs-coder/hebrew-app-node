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
import {useNavigate} from 'react-router-dom'

export default function HomePage() {
  const { t } = useTranslation();
  const app = useAppBridge();
  const redirect = Redirect.create(app);
  const navigate = useNavigate();
  const authenticatedFetch = useAuthenticatedFetch();
  const [subscriptions, setSubscriptions] = useState([]);
  const appBridge = useAppBridge();
  const subscription = useSelector((state) => state.subscription);

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
    if(subscription) {
      navigate("dashboard");
    }
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
          dispatch(login({ subscription: data.subscription }));
          console.log(data)
          navigate("dashboard");
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
        //  const order = ["basic", "pro", "premium"];

        //  // Sort the subscriptions based on the defined order
        //  data = data.sort(
        //    (a, b) => order.indexOf(a.name) - order.indexOf(b.name)
        //  );

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
