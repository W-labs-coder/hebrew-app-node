import React, { useEffect, useState } from "react";
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
import MailIcon from "../components/svgs/MailIcon";
import WhatsappIcon2 from "../components/svgs/WhatsappIcon2";

export default function Support() {

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Page >
          <Layout>
            <Layout.Section>
              <div>
                <SupportSection  />
              </div>
            </Layout.Section>
          </Layout>
        </Page>
      </div>
    </div>
  );
}

const SupportSection = () => {


  return (
    <section className="rtl-section">
      <div className="rtl-header">
        <h2 className="rtl-title">תמיכה</h2>
        <p className="rtl-description">
          פנה לצוות התמיכה שלנו לקבלת עזרה בכל שאלה או בעיה.
        </p>
      </div>

      <div
        class="d-flex flex-column jcs"
        style={{
          margin: "16px 0",
          border: "1px solid #C6C6C6",
          borderRadius: "16px",
          padding: "16px",
          gap: "16px",
          backgroundColor: "#FBFBFB",
        }}
      >
        <div
          class="d-flex flex-column jcs"
          style={{
          
            border: "1px solid #C6C6C6",
            borderRadius: "16px",
            padding: "16px",
            gap: "16px",
            backgroundColor: "#FBFBFB",
          }}
        >
          <div
            style={{
              backgroundColor: "#FBFBFB",
              lineHeight: "21px !important",
            }}
          >
            <p className="fs14 fw700" style={{ color: "#0D0D0D" }}>
              האם אתה נתקל בבעיה כלשהי?
            </p>
            <p className="fs14 fw500 mt-3" style={{ color: "#777" }}>
              או שאתה יכול ליצור קשר בכתובת
            </p>
            <div className="d-flex aic mt-2">
              <div className="d-flex aic gap-2">
                <MailIcon />
                <p
                  className="fs14 fw500"
                  style={{ color: "#063DD0", cursor: "pointer"}}
                >
                  Support@hebrewapp.com
                </p>
              </div>
              <div className="d-flex aic gap-2">
                <WhatsappIcon2 />
                <p
                  className="fs14 fw500"
                  style={{ color: "#063DD0", cursor: "pointer"}}
                >
                  +234 1234 5678
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
