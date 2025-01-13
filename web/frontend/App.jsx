import { BrowserRouter } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavMenu } from "@shopify/app-bridge-react";
import Routes from "./Routes";

import { QueryProvider, PolarisProvider } from "./components";
import { Provider } from "react-redux";
import store, { persistor } from "./store/store";
import { PersistGate } from "redux-persist/integration/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  // Any .tsx or .jsx files in /pages will become a route
  // See documentation for <Routes /> for more info
  const pages = import.meta.glob("./pages/**/!(*.test.[jt]sx)*.([jt]sx)", {
    eager: true,
  });
  const { t } = useTranslation();

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <PolarisProvider>
          <BrowserRouter>
            <QueryProvider>
              <ToastContainer position="top-right" autoClose={3000} />
              <NavMenu>
                <a href="/dashboard" rel="home" />
              </NavMenu>
              <Routes pages={pages} />
            </QueryProvider>
          </BrowserRouter>
        </PolarisProvider>
      </PersistGate>
    </Provider>
  );
}
