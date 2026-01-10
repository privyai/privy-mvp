import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getChatById } from "@/lib/db/queries";

export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      <ChatPage params={props.params} />
    </Suspense>
  );
}

async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chat = await getChatById({ id });

  if (!chat) {
    redirect("/");
  }

  // Auth is now handled client-side by TokenProvider
  // API calls include the token via x-privy-token header
  // Permission checks happen when user makes API calls

  // Messages are loaded client-side via API to support decryption
  // The API route has access to the token and can decrypt properly

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model");

  // For private chats, the API routes will validate ownership
  // when the user tries to interact (send messages, etc.)
  // Users can always chat in their own conversations
  const isReadonly = false;

  if (!chatModelFromCookie) {
    return (
      <>
        <Chat
          autoResume={true}
          id={chat.id}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialMessages={[]}
          initialVisibilityType={chat.visibility}
          isReadonly={isReadonly}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        autoResume={true}
        id={chat.id}
        initialChatModel={chatModelFromCookie.value}
        initialMessages={[]}
        initialVisibilityType={chat.visibility}
        isReadonly={isReadonly}
      />
      <DataStreamHandler />
    </>
  );
}

