import { useState } from "react";
import { MessageSquare, Send, Check, CheckCheck, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMessages, useSendMessage, useMarkMessageRead } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { useTenants } from "@/hooks/useTenants";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Messages() {
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages();
  const { data: tenants } = useTenants();
  const sendMessage = useSendMessage();
  const markRead = useMarkMessageRead();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [receiverId, setReceiverId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedMsg, setSelectedMsg] = useState<string | null>(null);

  const handleSend = async () => {
    if (!receiverId || !body.trim()) return;
    try {
      await sendMessage.mutateAsync({ receiver_id: receiverId, subject: subject || undefined, body });
      toast({ title: "Message sent" });
      setOpen(false);
      setReceiverId("");
      setSubject("");
      setBody("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleSelect = (msg: any) => {
    setSelectedMsg(msg.id);
    if (!msg.is_read && msg.receiver_id === user?.id) {
      markRead.mutate(msg.id);
    }
  };

  const unreadCount = messages?.filter((m) => !m.is_read && m.receiver_id === user?.id).length || 0;

  // Get unique users who have tenants linked (for compose)
  const tenantUsers = tenants?.filter((t) => t.user_id).map((t) => ({ id: t.user_id!, name: t.full_name })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Messages</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Compose</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Message</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Select value={receiverId} onValueChange={setReceiverId}>
                <SelectTrigger><SelectValue placeholder="Select recipient" /></SelectTrigger>
                <SelectContent>
                  {tenantUsers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)} />
              <Textarea placeholder="Type your message..." value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
              <Button onClick={handleSend} disabled={sendMessage.isPending} className="w-full">
                <Send className="mr-2 h-4 w-4" />{sendMessage.isPending ? "Sending..." : "Send"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !messages?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">No messages yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
          {/* Message list */}
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {messages.map((msg) => {
              const isSender = msg.sender_id === user?.id;
              const isUnread = !msg.is_read && !isSender;
              return (
                <Card
                  key={msg.id}
                  className={`cursor-pointer transition-colors hover:bg-accent/50 ${selectedMsg === msg.id ? "border-primary" : ""} ${isUnread ? "bg-primary/5" : ""}`}
                  onClick={() => handleSelect(msg)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm ${isUnread ? "font-bold" : "font-medium"} text-foreground`}>
                          {isSender ? `To: ${msg.receiver_name}` : msg.sender_name}
                        </p>
                        {msg.subject && <p className="truncate text-xs text-muted-foreground">{msg.subject}</p>}
                        <p className="mt-1 truncate text-xs text-muted-foreground">{msg.body}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] text-muted-foreground">{format(new Date(msg.created_at), "MMM d")}</span>
                        {isSender && (msg.is_read ? <CheckCheck className="h-3 w-3 text-primary" /> : <Check className="h-3 w-3 text-muted-foreground" />)}
                        {isUnread && <Badge variant="default" className="h-4 text-[10px]">New</Badge>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Selected message detail */}
          <Card className="hidden lg:block">
            {selectedMsg ? (() => {
              const msg = messages.find((m) => m.id === selectedMsg);
              if (!msg) return null;
              const isSender = msg.sender_id === user?.id;
              return (
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-foreground">{msg.subject || "(No subject)"}</h3>
                      <p className="text-sm text-muted-foreground">
                        {isSender ? `To: ${msg.receiver_name}` : `From: ${msg.sender_name}`} · {format(new Date(msg.created_at), "PPp")}
                      </p>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-foreground">{msg.body}</p>
                </CardContent>
              );
            })() : (
              <CardContent className="flex h-64 items-center justify-center text-muted-foreground">
                Select a message to read
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
