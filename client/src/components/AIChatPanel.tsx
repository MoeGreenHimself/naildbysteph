import { useState, useEffect } from "react";
import { Message, AIChatBox } from "./AIChatBox";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Sparkles, X, Mic, Volume2, VolumeX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useVoiceChat } from "@/hooks/useVoiceChat";

const AI_NAME = "Homegirl AI";

export function AIChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { isSupported, isListening, transcript, isSpeaking, startListening, stopListening, speak, stopSpeaking, setTranscript } = useVoiceChat();

  // Handle dictation input
  useEffect(() => {
    if (transcript) {
      handleSendMessage(transcript);
      setTranscript(''); // Clear transcript after sending
    }
  }, [transcript]);

  // Handle AI speaking the response
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && !isSpeaking) {
        speak(lastMessage.content);
      }
    }
  }, [messages, speak, isSpeaking]);

  // 1. Fetch history and settings
  const historyQuery = trpc.ai.history.useQuery(undefined, {
    enabled: isOpen,
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      // Filter out system messages and map to client Message type
      const clientMessages: Message[] = data.map(h => ({
        role: h.role as Message["role"],
        content: h.content,
      }));
      setMessages(clientMessages);
    }
  });

  const settingsQuery = trpc.ai.settings.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  // 2. Handle chat mutation
  const chatMutation = trpc.ai.message.useMutation({
    onMutate: (newMessage) => {
      // Optimistically add user message
      const userMessage: Message = { role: "user", content: newMessage.message };
      setMessages(prev => [...prev, userMessage]);
    },
    onSuccess: (data) => {
      // Add assistant response
      const assistantMessage: Message = { role: "assistant", content: data.response };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
      console.error("AI Chat Error:", error);
      // Revert optimistic update and show error message
      setMessages(prev => prev.slice(0, -1));
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `My bad, girl. Ran into a little drama: ${error.message}. Try again?`,
      }]);
    }
  });

  const handleSendMessage = (content: string) => {
    if (isSpeaking) stopSpeaking();
    chatMutation.mutate({ message: content });
  };

  // Suggested prompts based on the workflow-focused personality
  const suggestedPrompts = [
    "What's my schedule look like today?",
    "Did any deposits come in?",
    "Remind me to order more monomer.",
    "What's my VIP score right now?",
    "Give me the full system tutorial.",
  ];

  // Determine chat box height based on screen size (for dark-mode aesthetic)
  const chatBoxHeight = "70vh";

  return (
    <>
      {/* Floating Bubble */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 rounded-full shadow-lg transition-all duration-300",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
        size="icon"
        aria-label="Open AI Chat"
      >
        <Sparkles className="size-6" />
      </Button>

      {/* Collapsible Panel */}
      <div
        className={cn(
          "fixed bottom-0 right-0 z-50 transition-all duration-300 ease-in-out",
          "w-full sm:w-[400px] md:w-[450px] lg:w-[500px]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{ height: "100vh", maxHeight: "100vh" }}
      >
        <Card
          className={cn(
            "flex flex-col h-full rounded-none sm:rounded-tl-lg border-0 sm:border-l sm:border-t shadow-2xl",
            "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" // Maintain dark-mode aesthetic
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              {AI_NAME}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close AI Chat"
            >
              <X className="size-5" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <AIChatBox
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={chatMutation.isPending || historyQuery.isLoading || isListening}
              placeholder={`Ask ${AI_NAME} a question...`}
              height={chatBoxHeight}
              emptyStateMessage={`Hey girl! I'm ${AI_NAME}. I'm here to help you with your workflow. What's the plan for today?`}
              suggestedPrompts={suggestedPrompts}
              className="h-full border-0 rounded-none"
            />
            {isSupported && (
              <div className="flex justify-between items-center p-2 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={isListening ? stopListening : startListening}
                  className={cn("text-sm", isListening ? "text-red-500 hover:text-red-600" : "text-gray-600 hover:text-pink-600")}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  {isListening ? "Listening..." : "Dictate"}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={isSpeaking ? stopSpeaking : () => {
                    // Re-speak the last AI message if available
                    const lastMessage = messages.findLast(m => m.role === 'assistant');
                    if (lastMessage) speak(lastMessage.content);
                  }}
                  className={cn("text-sm", isSpeaking ? "text-pink-600 hover:text-pink-700" : "text-gray-600 hover:text-pink-600")}
                  disabled={!messages.findLast(m => m.role === 'assistant')}
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                  {isSpeaking ? "Stop Voice" : "Read Last"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
