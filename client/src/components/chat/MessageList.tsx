import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjectMessages, sendMessage } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { Project, Message } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SendIcon } from "lucide-react";

interface MessageListProps {
  project: Project;
}

export function MessageList({ project }: MessageListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Connect to WebSocket for real-time messaging
  const { connected, messages: wsMessages } = useWebSocket(`/ws`);

  // Fetch project messages
  const { data, isLoading } = useQuery({
    queryKey: [`/api/projects/${project.id}/messages`],
    queryFn: () => getProjectMessages(project.id),
  });
  
  const messages = data?.messages || [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ projectId, content }: { projectId: number, content: string }) => 
      sendMessage(projectId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}/messages`] });
      setMessageText("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "There was an error sending your message",
        variant: "destructive",
      });
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for WebSocket messages and update the message list
  useEffect(() => {
    if (wsMessages.length > 0) {
      // Check if the message is for this project
      const latestMessage = wsMessages[wsMessages.length - 1];
      if (latestMessage.type === 'new-message' && latestMessage.projectId === project.id) {
        // Invalidate the query to refetch messages
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}/messages`] });
      }
    }
  }, [wsMessages, project.id, queryClient]);

  // Handle message submission
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    
    sendMessageMutation.mutate({
      projectId: project.id,
      content: messageText,
    });
  };
  
  // Function to format message time
  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get other party details
  const otherParty = project.userId === user?.id
    ? { id: project.providerId, role: 'provider' }
    : { id: project.userId, role: 'customer' };
  
  return (
    <Card className="border shadow-sm">
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="text-lg">
          Project Communication
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[400px] overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4 ml-auto" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-12 w-2/4 ml-auto" />
            </div>
          ) : messages.length > 0 ? (
            messages.map((message: Message) => {
              const isCurrentUser = message.senderId === user?.id;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex max-w-xs sm:max-w-md ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                    <Avatar className={`h-8 w-8 ${isCurrentUser ? "ml-2" : "mr-2"}`}>
                      <AvatarFallback>
                        {isCurrentUser 
                          ? user.username.substring(0, 2).toUpperCase() 
                          : otherParty.role.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div 
                      className={`p-3 rounded-lg ${
                        isCurrentUser 
                          ? "bg-primary-50 text-gray-800 rounded-tr-none" 
                          : "bg-gray-100 text-gray-800 rounded-tl-none"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs text-right text-gray-500 mt-1">
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 mb-2">No messages yet</p>
                <p className="text-sm text-gray-400">Start the conversation by sending a message.</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <CardFooter className="p-3 border-t">
        <form onSubmit={handleSendMessage} className="flex w-full space-x-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="sm"
            disabled={sendMessageMutation.isPending || !messageText.trim()}
          >
            <SendIcon className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
