import React, { useState, useEffect } from "react";
import { DataTable, EmptyState, Layout, LegacyCard, Page } from "@shopify/polaris";
import Sidebar from "../../components/Sidebar";
import Input from "../../components/form/Input";
import Button from "../../components/form/Button";
import CheckLightIcon from "../../components/svgs/CheckLightIcon";
import { toast } from "react-toastify";
import { login } from "../../store/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import AlertIcon3 from "../../components/svgs/AlertIcon3";
import CheckDarkIcon from "../../components/svgs/CheckDarkIcon";

export default function CancellationHistory() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Page>
          <Layout>
            <Layout.Section>
              <div>
                <CancellationHistorySettings />
              </div>
            </Layout.Section>
          </Layout>
        </Page>
      </div>
    </div>
  );
}

const CancellationHistorySettings = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellations, setCancellations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCancellations();
  }, [currentPage]);

  const fetchCancellations = async () => {
    try {
      const response = await fetch(`/api/settings/transaction-cancellation/list?page=${currentPage}&limit=10`);
      if (!response.ok) throw new Error('Failed to fetch cancellations');
      
      const data = await response.json();
      
      // Transform cancellations into table rows
      const tableRows = data.data.map(cancellation => [
        cancellation.orderNumber,
        cancellation.fullName,
        cancellation.email,
        cancellation.phone,
        new Date(cancellation.createdAt).toLocaleDateString('he-IL')
      ]);

      setCancellations(tableRows);
      setHasNextPage(currentPage < data.pagination.totalPages);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching cancellations:', error);
      toast.error('Failed to load cancellation history');
      setIsLoading(false);
    }
  };

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1);
  };

  return (
    <section>
      <div style={{ marginBottom: "30px" }}>
        <p className="fw700 fs18">היסטוריית ביטולים</p>
        <p className="fs14 fw500" style={{ color: "#777" }}>
          הצג ועקוב אחר ההיסטוריה של העסקאות וההזמנות המבוטלות שלך.
        </p>
      </div>

      <LegacyCard>
        <DataTable
          className="rtl"
          columnContentTypes={["text", "text", "text", "text", "text"]}
          headings={["מספר הזמנה", "שם הלקוח", "אימייל", "טלפון", "תאריך בקשה"]}
          rows={cancellations}
          loading={isLoading}
          pagination={{
            hasNext: hasNextPage,
            onNext: handleNextPage,
          }}
        />
        {cancellations.length === 0 && (
          <EmptyState
            heading="No History"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Track and display all orders cancelled.</p>
          </EmptyState>
        )}
      </LegacyCard>
    </section>
  );
};
