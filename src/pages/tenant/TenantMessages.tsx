import { useState } from "react";
import { MessageSquare, Send, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTenantRecord, useMyMessages, useSendTenantMessage } from "@/hooks/useTenantRecord";
import { useMarkMessageRead } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";

export default function TenantMessages() {
  const { user } = useAuth();
  const { data: tenant } = useTenantRecord();
  const { data: messages, isLoading } = useMyMessages(user?.id);
  const sendMessage = useSendTenantMessage();

  const markRead = useMarkMessageRead();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const unit = tenant?.unit as any;
  const landlordId = unit?.property?.owner_id as string | undefined;

  const handleSend = async () => {
    if (!body.trim()) return toast.error("Message body is required");
    if (!landlordId) return toast.error("Could not identify your property manager. Contact them directly.");
    try {
      await sendMessage.mutateAsync({
        receiver_id: landlordId,
        subject: subject.trim() || undefined,
        body: body.trim(),
        tenant_id: tenant?.id,
      });
      toast.success("Message sent");
      setSubject("");
      setBody("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    }
  };

  const selectedMsg = messages?.find((m) => m.id === selectedId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {messages?.filter((m) => !m.is_read && m.receiver_id === user?.id).length
            ? `${messages.filter((m) => !m.is_read && m.receiver_id === user?.id).length} unread`
            : "Communicate with your property manager"}
        </p>
      </div>

      {/* Compose */}
      <div className="stat-card space-y-3">
        <h2 className="font-heading text-base font-semibold text-card-foreground">Send a Message</h2>
        {!landlordId && (
          <p className="rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
            Your property manager information is not available yet. Make sure you're assigned to a unit.
          </p>
        )}
        <Input
          placeholder="Subject (optional)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={!landlordId}
        />
        <textarea
          className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          rows={3}
          placeholder="Type your message..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={!landlordId}
        />
        <Button
          className="gap-2"
          onClick={handleSend}
          disabled={sendMessage.isPending || !landlordId || !body.trim()}
        >
          <Send className="h-4 w-4" />
          {sendMessage.isPending ? "Sending..." : "Send Message"}
        </Button>
      </div>

      {/* Message history */}
      {!messages?.length ? (
        <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-heading text-lg font-semibold text-card-foreground">No messages yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Send your first message to your property manager above</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
          {/* List */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {messages.map((msg) => {
              const isSender = msg.sender_id === user?.id;
              const isUnread = !msg.is_read && !isSender;
              return (
                <div
                  key={msg.id}
                  onClick={() => {
                    setSelectedId(msg.id);
                    if (isUnread) markRead.mutate(msg.id);
                  }}
                  className={`cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/30 ${selectedId === msg.id ? "border-primary" : ""} ${isUnread ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm ${isUnread ? "font-bold" : "font-medium"} text-foreground`}>
                        {isSender ? `To: ${msg.receiver_name}` : `From: ${msg.sender_name}`}
                      </p>
                      {msg.subject && <p className="truncate text-xs text-muted-foreground">{msg.subject}</p>}
                      <p className="mt-1 truncate text-xs text-muted-foreground">{msg.body}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[10px] text-muted-foreground">{format(new Date(msg.created_at), "MMM d")}</span>
                      {isSender && (msg.is_read ? <CheckCheck className="h-3 w-3 text-primary" /> : <Check className="h-3 w-3 text-muted-foreground" />)}
                      {isUnread && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground font-medium">New</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail */}
          <div className="hidden rounded-lg border bg-card lg:block">
            {selectedMsg ? (
              <div className="p-6">
                <h3 className="font-heading text-lg font-semibold text-foreground">{selectedMsg.subject || "(No subject)"}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedMsg.sender_id === user?.id ? `To: ${selectedMsg.receiver_name}` : `From: ${selectedMsg.sender_name}`}
                  {" · "}{format(new Date(selectedMsg.created_at), "PPp")}
                </p>
                <div className="mt-4 border-t pt-4">
                  <p className="whitespace-pre-wrap text-sm text-foreground">{selectedMsg.body}</p>
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Select a message to read
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
