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
import VideoSvg from "../components/svgs/VideoSvg";
import PlayIcon from "../components/svgs/PlayIcon";

const Training = () => {
  const [isOpen, setIsOpen] = useState({
    collapseOne: true,
    collapseTwo: false,
  });

  const toggleAccordion = (collapseId) => {
    setIsOpen((prevState) => ({
      ...prevState,
      [collapseId]: !prevState[collapseId],
    }));
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Page>
          <Layout>
            <Layout.Section>
              <div>
                <TrainingSection
                  isOpen={isOpen}
                  toggleAccordion={toggleAccordion}
                />
              </div>
            </Layout.Section>
          </Layout>
        </Page>
      </div>
    </div>
  );
};

const TrainingSection = ({ isOpen, toggleAccordion }) => {
  return (
    <section>
      <div>
        <p className="fw700 fs18">סרטוני הדרכה</p>
        <p className="fs14" style={{ color: "#777" }}>
          למדו כל מה שאתם צריכים לדעת על האפליקציה בעברית עם הסרטונים המוקפדים
          שלנו שישדרגו את החוויה שלכם באפליקציה.
        </p>
      </div>

      <div
        className="d-flex flex-column jcs"
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
          style={{
            backgroundColor: "#FBFBFB",
            lineHeight: "21px !important",
            border: "1px solid #C6C6C6",
            borderRadius: "10px",
            padding: "16px",
            gap: "16px",
          }}
          className="d-flex  ais flex-column"
        >
          <p className="fs14 fw700">צפה בסרטוני הדרכה</p>

          <div className="accordion" id="training" style={{ width: "100%" }}>
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingOne">
                <div
                  className="accordion-button"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseOne"
                  aria-expanded={isOpen.collapseOne}
                  aria-controls="collapseOne"
                  onClick={() => toggleAccordion("collapseOne")}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span className="ms-auto">
                    התחלת עבודה עם אפליקציית עברית
                  </span>
                  <span className="icon me-auto" style={{ marginLeft: "10px" }}>
                    {isOpen.collapseOne ? "-" : "+"}
                  </span>
                </div>
              </h2>
              <div
                id="collapseOne"
                className={`accordion-collapse collapse ${
                  isOpen.collapseOne ? "show" : ""
                }`}
                aria-labelledby="headingOne"
                data-bs-parent="#training"
              >
                <div className="accordion-body">
                  <div className="d-flex gap-3 aic jcs">
                    <div>
                      <PlayIcon />
                    </div>
                    <p className="fs14">איך לנווט באפליקציה בעברית</p>
                    <p className="fs14" style={{ color: "#777777" }}>00:45</p>
                  </div>
                  <hr />
                  <div className="d-flex gap-3 aic jcs">
                    <div>
                      <PlayIcon />
                    </div>
                    <p className="fs14">איך להירשם לחבילות פרימיום</p>
                    <p className="fs14" style={{ color: "#777777" }}>00:45</p>
                  </div>
                  <hr />
                  <div className="d-flex gap-3 aic jcs">
                    <div>
                      <PlayIcon />
                    </div>
                    <p className="fs14">כרטיסיות ניווט ופונקציות</p>
                    <p className="fs14" style={{ color: "#777777" }}>00:45</p>
                  </div>
                  <hr />
                  <div className="d-flex gap-3 aic jcs">
                    <div>
                      <PlayIcon />
                    </div>
                    <p className="fs14">כל מה שצריך לדעת על אפליקציית עברית</p>
                    <p className="fs14" style={{ color: "#777777" }}>00:45</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingTwo">
                <div
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseTwo"
                  aria-expanded={isOpen.collapseTwo}
                  aria-controls="collapseTwo"
                  onClick={() => toggleAccordion("collapseTwo")}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span className="ms-auto">
                    תכונות מרכזיות של אפליקציה בעברית (חלק 1)
                  </span>
                  <span className="icon me-auto" style={{ marginLeft: "10px" }}>
                    {isOpen.collapseTwo ? "-" : "+"}
                  </span>
                </div>
              </h2>
              <div
                id="collapseTwo"
                className={`accordion-collapse collapse ${
                  isOpen.collapseTwo ? "show" : ""
                }`}
                aria-labelledby="headingTwo"
                data-bs-parent="#training"
              >
                <div className="accordion-body"></div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingThree">
                <div
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseThree"
                  aria-expanded="false"
                  aria-controls="collapseThree"
                >
                  פונקציות מרכזיות של אפליקציה בעברית (חלק 2)
                  <span className="icon"></span>
                </div>
              </h2>
              <div
                id="collapseThree"
                className="accordion-collapse collapse"
                aria-labelledby="headingThree"
                data-bs-parent="#training"
              >
                <div className="accordion-body"></div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingFour">
                <div
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseThree"
                  aria-expanded="false"
                  aria-controls="collapseThree"
                >
                  תכונות מרכזיות של אפליקציה בעברית (חלק 3)
                  <span className="icon"></span>
                </div>
              </h2>
              <div
                id="collapseThree"
                className="accordion-collapse collapse"
                aria-labelledby="headingFour"
                data-bs-parent="#training"
              >
                <div className="accordion-body"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Training;
