import { Layout, Page } from "@shopify/polaris";
import Sidebar from "../components/Sidebar";
import Input from "../components/form/Input";
import PaymentImage from "../components/svgs/PaymentImage";


export default function Payment() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Page fullWidth>
          <Layout>
            <Layout.Section>
              <div>
                <PaymentSection />
              </div>
            </Layout.Section>
          </Layout>
        </Page>
      </div>
    </div>
  );
}


const PaymentSection = () => {
  const processors = [
    { name: "American Express", icon: "american_express.png" },
    { name: "Diners", icon: "diners.png" },
    { name: "Apple Pay", icon: "apple_pay.png" },
    { name: "Bit", icon: "bit.png" },
    { name: "Iscracard", icon: "iscracard.png" },
    { name: "Google Pay", icon: "google_pay.png" },
    { name: "Visa", icon: "visa.png" },
    { name: "Master Card", icon: "master_card.png" },
    { name: "Paypal", icon: "paypal.png" },
  ];

  const features = [
    { name: "delivery", icon: "delivery-svg" },
    { name: "package", icon: "package-svg" },
    { name: "airplane", icon: "airplane-svg" },
    { name: "sent", icon: "paper-plane-svg" },
  ];

  return (
    <section>
      <div>
        <p className="fw700 fs18">משדרגים את הביטחון:חיזוק הביטחון ללקוחותיך</p>
        <p className="fs14 fw500" style={{ color: "#777" }}>
          בחר את שיטת התשלום המועדפת עליך לחוויית תשלום חלקה.
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
            lineHeight: "21px",
            border: "1px solid #C6C6C6",
            borderRadius: "10px",
            padding: "16px",
          }}
          className="d-flex jcb ais"
        >
          <div>
            <form style={{ gap: "24px" }} className="d-flex flex-column">
              <div>
                <p className="fw700 fs14">בחירת צבע רקע:</p>
                <div className="d-flex flex-column">
                  <label>
                    <input
                      type="radio"
                      name="background_color"
                      value="transparent"
                    />
                    <span className="fs14 fw500 me-3" style={{ color: "#777" }}>
                      צבע רקע שקוף
                    </span>
                  </label>
                  <label>
                    <input type="radio" name="background_color" value="white" />
                    <span className="fs14 fw500 me-3" style={{ color: "#777" }}>
                      צבע רקע לבן
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <p className="fs14 fw700">גודל מותאם אישית:</p>
                <div className="d-lg-flex gap-3 aic jcs">
                  <Input
                    type="number"
                    label=""
                    id="width"
                    name="width"
                    placeholder="60"
                  />
                  <p className="fw700 fs14 text-center">x</p>
                  <Input
                    type="number"
                    label=""
                    id="height"
                    name="height"
                    placeholder="38"
                  />
                </div>
              </div>

              <div>
                <Input
                  type="text"
                  label="בחירת טקסט שיופיע מעל אמצעי התשלום:"
                  id="textAbove"
                  name="textAbove"
                  placeholder="הקלד כאן..."
                />
              </div>

              <div>
                <p className="fw700 fs14">בחירת אמצעי תשלום:</p>
                <div className="row">
                  {processors.map((processor) => (
                    <div className="col-3" key={processor.name}>
                      <label className="fs14 fw500" style={{ color: '#0D0D0D' }}>
                        <img
                          src={`../components/pngs/payments/${processor.icon}`}
                          alt={processor.name}
                        />
                        <input
                          type="checkbox"
                          name="processor"
                          value={processor.name}
                        />
                        {processor.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                style={{
                  height: "37px",
                  width: "83px",
                  borderRadius: "24px",
                  color: "#0D0D0D",
                  backgroundColor: "#FBB105",
                  border: "1px solid #FBB105",
                }}
              >
                לְהַצִיל
              </button>
            </form>
          </div>
          <div className="">
            <PaymentImage />
          </div>
        </div>
      </div>
    </section>
  );
};


