"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Recipient = {
  id: string;
  name: string;
  email: string;
  isCurrentUser?: boolean;
};

type RecipientsContextValue = {
  recipients: Recipient[];
  setRecipients: (recipients: Recipient[]) => void;
  hasAddedSelf: boolean;
  setHasAddedSelf: (value: boolean) => void;
  enableSigningOrder: boolean;
  setEnableSigningOrder: (value: boolean) => void;
  selectedRecipientEmail: string | null;
  setSelectedRecipientEmail: (email: string | null) => void;
  getRecipientColor: (email: string) => string;
};

const RecipientsContext = createContext<RecipientsContextValue | undefined>(
  undefined
);

export function RecipientsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [hasAddedSelf, setHasAddedSelf] = useState(false);
  const [enableSigningOrder, setEnableSigningOrder] = useState(false);
  const [selectedRecipientEmail, setSelectedRecipientEmail] = useState<
    string | null
  >(null);

  // Color palette for recipients
  const palette = [
    "#2563eb",
    "#22c55e",
    "#eab308",
    "#f97316",
    "#a855f7",
    "#06b6d4",
  ];

  const getRecipientColor = (email: string) => {
    const index = recipients.findIndex((r) => r.email === email);
    if (index === -1) return palette[0];
    return palette[index % palette.length];
  };

  // Ensure a selected recipient exists when recipients list changes
  useEffect(() => {
    if (!selectedRecipientEmail && recipients.length > 0) {
      setSelectedRecipientEmail(recipients[0].email);
    }
    if (
      selectedRecipientEmail &&
      !recipients.find((r) => r.email === selectedRecipientEmail)
    ) {
      setSelectedRecipientEmail(recipients[0]?.email ?? null);
    }
  }, [recipients, selectedRecipientEmail]);

  const value = useMemo(
    () => ({
      recipients,
      setRecipients,
      hasAddedSelf,
      setHasAddedSelf,
      enableSigningOrder,
      setEnableSigningOrder,
      selectedRecipientEmail,
      setSelectedRecipientEmail,
      getRecipientColor,
    }),
    [recipients, hasAddedSelf, enableSigningOrder, selectedRecipientEmail]
  );

  return (
    <RecipientsContext.Provider value={value}>
      {children}
    </RecipientsContext.Provider>
  );
}

export function useRecipients() {
  const ctx = useContext(RecipientsContext);
  if (!ctx) {
    throw new Error("useRecipients must be used within a RecipientsProvider");
  }
  return ctx;
}
