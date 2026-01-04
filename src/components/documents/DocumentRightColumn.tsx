// components/documents/DocumentRightColumn.tsx
"use client";

import { useUser } from "@/hooks/useUser";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  PlusIcon,
  InfoIcon,
  User as UserIcon,
  Trash2Icon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "lucide-react";
import { useRecipients } from "./RecipientsProvider";


const DocumentRightColumn = () => {
  const { user, isLoading: userLoading } = useUser();
  const {
    recipients,
    setRecipients,
    hasAddedSelf,
    setHasAddedSelf,
    enableSigningOrder,
    setEnableSigningOrder,
  } = useRecipients();

  const addCurrentUser = () => {
    if (!user || hasAddedSelf) return;

    const currentUserRecipient = {
      id: `user-${user.id}`,
      name: user.name || "",
      email: user.email,
      isCurrentUser: true,
    };

    setRecipients([currentUserRecipient, ...recipients]);
    setHasAddedSelf(true);
  };

  const addNewSigner = () => {
    const newRecipient = {
      id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: "",
      email: "",
    };
    setRecipients([...recipients, newRecipient]);
  };

  const updateRecipient = (
    id: string,
    field: "name" | "email",
    value: string
  ) => {
    setRecipients(
      recipients.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const removeRecipient = (id: string) => {
    const removed = recipients.find((r) => r.id === id);
    setRecipients(recipients.filter((r) => r.id !== id));

    if (removed?.isCurrentUser) {
      setHasAddedSelf(false);
    }
  };

  const moveRecipient = (index: number, direction: "up" | "down") => {
    if (!enableSigningOrder) return;

    const newRecipients = [...recipients];
    if (direction === "up" && index > 0) {
      [newRecipients[index], newRecipients[index - 1]] = [
        newRecipients[index - 1],
        newRecipients[index],
      ];
    } else if (direction === "down" && index < recipients.length - 1) {
      [newRecipients[index], newRecipients[index + 1]] = [
        newRecipients[index + 1],
        newRecipients[index],
      ];
    }
    setRecipients(newRecipients);
  };

  if (userLoading) {
    return <div className="p-6 text-center text-gray-500">Loading user...</div>;
  }

  return (
    <div className="bg-white border-l shadow-sm h-full overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="bg-[#f3f4f6] py-4 px-5 shrink-0 border-b">
        <h1 className="text-lg font-semibold text-gray-800">Recipients</h1>
        <p className="text-xs text-gray-500 mt-1">
          Add recipients to your document
        </p>
      </div>

      {/* Add Buttons */}
      <div className="flex gap-3 py-3 px-5 shrink-0">
        {hasAddedSelf ? (
          <Button
            onClick={() => removeRecipient(`user-${user?.id}`)}
            className="flex-1 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-100"
          >
            <Trash2Icon className="mr-2 h-4 w-4" />
            Remove Me
          </Button>
        ) : (
          <Button
            onClick={addCurrentUser}
            disabled={!user}
            className="flex-1 rounded-xl bg-gray-50 border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50"
          >
            <UserIcon className="mr-2 h-4 w-4" />
            Add Myself
          </Button>
        )}
        <Button
          onClick={addNewSigner}
          className="flex-1 rounded-xl bg-gray-50 border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-100"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Signer
        </Button>
      </div>

      {/* Signing Order Toggle */}
      <div className="px-5 py-4 border-b bg-gray-50">
        <TooltipProvider>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="signing-order"
              checked={enableSigningOrder}
              onCheckedChange={(checked) => setEnableSigningOrder(!!checked)}
            />
            <Label
              htmlFor="signing-order"
              className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2"
            >
              Enable signing order
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    When enabled, recipients will sign in the exact order listed. 
                    The first recipient must complete signing before the next receives the document. 
                    Disable for simultaneous signing.
                  </p>
                </TooltipContent>
              </Tooltip>
            </Label>
          </div>
        </TooltipProvider>
      </div>

      {/* Recipients List */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {recipients.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            <p className="text-sm">No recipients added yet</p>
            <p className="text-xs mt-2">
              Click "Add Myself" or "Add Signer" to begin
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recipients.map((recipient, index) => (
              <div
                key={recipient.id}
                className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow transition-shadow"
              >
                {/* Header */}
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {enableSigningOrder && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                        {index + 1}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {recipient.name || "Unnamed Signer"}
                      </p>
                      {recipient.isCurrentUser && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 mt-1">
                          You
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {enableSigningOrder && recipients.length > 1 && (
                      <>
                        <button
                          onClick={() => moveRecipient(index, "up")}
                          disabled={index === 0}
                          className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Move up"
                        >
                          <ChevronUpIcon className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => moveRecipient(index, "down")}
                          disabled={index === recipients.length - 1}
                          className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Move down"
                        >
                          <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                        </button>
                      </>
                    )}
                    {!recipient.isCurrentUser && (
                      <button
                        onClick={() => removeRecipient(recipient.id)}
                        className="p-1.5 rounded-md hover:bg-red-100 transition-colors"
                        aria-label="Remove recipient"
                      >
                        <Trash2Icon className="h-4 w-4 text-red-600" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Fields */}
                <div className="px-4 py-4 space-y-3">
                  <div>
                    <Label className="text-xs text-gray-600 font-medium">
                      Name
                    </Label>
                    <Input
                      value={recipient.name}
                      onChange={(e) =>
                        updateRecipient(recipient.id, "name", e.target.value)
                      }
                      placeholder="Enter name"
                      disabled={recipient.isCurrentUser}
                      className="mt-1 h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 font-medium">
                      Email
                    </Label>
                    <Input
                      type="email"
                      value={recipient.email}
                      onChange={(e) =>
                        updateRecipient(recipient.id, "email", e.target.value)
                      }
                      placeholder="Enter email"
                      disabled={recipient.isCurrentUser}
                      className="mt-1 h-9 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentRightColumn;