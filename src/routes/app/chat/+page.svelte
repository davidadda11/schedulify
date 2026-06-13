<script lang="ts">
  import { onMount, tick } from 'svelte';

  type Message = { id: number; role: 'assistant' | 'user'; text: string };

  let messages = $state<Message[]>([
    { id: 1, role: 'assistant', text: 'Salut! 👋 Sunt Schedulify AI, asistentul tău educațional. Te pot ajuta cu teme, explicații la materii, sfaturi de studiu sau orice întrebare școlară. Cu ce începem?' }
  ]);
  let inputValue = $state('');
  let isTyping = $state(false);
  let chatContainer: HTMLElement | null = $state(null);
  let mounted = $state(false);
  let error = $state('');

  async function scrollToBottom() {
    await tick();
    if (chatContainer) {
      chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
    }
  }

  async function handleSend(e: Event) {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isTyping) return;

    error = '';
    messages = [...messages, { id: Date.now(), role: 'user', text }];
    inputValue = '';
    await scrollToBottom();

    isTyping = true;
    await scrollToBottom();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        error = data.error ?? 'Eroare la server.';
        isTyping = false;
        return;
      }

      const bubbles: string[] = data.bubbles ?? [data.text];

      // Afișează bulele pe rând cu delay
      for (let i = 0; i < bubbles.length; i++) {
        if (i > 0) {
          await new Promise(r => setTimeout(r, 600));
        }
        messages = [...messages, {
          id: Date.now() + i,
          role: 'assistant',
          text: bubbles[i]
        }];
        await scrollToBottom();
      }

    } catch {
      error = 'Nu mă pot conecta la Ollama. Verifică dacă rulează.';
    } finally {
      isTyping = false;
      await scrollToBottom();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  onMount(() => {
    setTimeout(() => { mounted = true; }, 100);
    scrollToBottom();
  });

  const SUGGESTIONS = [
    'Explică-mi teorema lui Pitagora',
    'Cum să memorez mai bine?',
    'Ajutor cu ecuații de gradul 2',
    'Sfaturi pentru bacalaureat'
  ];
</script>

<svelte:head>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="page" class:mounted>
  <div class="bg-blob blob-1"></div>
  <div class="bg-blob blob-2"></div>
  <div class="grid-overlay"></div>

  <div class="chat-interface">
    <div class="messages-viewport" bind:this={chatContainer}>
      <div class="messages-inner">

        {#if messages.length === 1}
          <div class="suggestions-wrap">
            <p class="suggestions-label">Începe cu o întrebare</p>
            <div class="suggestions">
              {#each SUGGESTIONS as s}
                <button class="suggestion-chip" onclick={() => { inputValue = s; }}>
                  {s}
                </button>
              {/each}
            </div>
          </div>
        {/if}

        {#each messages as msg (msg.id)}
          <div class="message-row {msg.role}">
            {#if msg.role === 'assistant'}
              <div class="avatar ai-avatar">
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="currentColor"/>
                </svg>
              </div>
            {/if}

            <div class="message-content">
              <span class="sender-name">
                {msg.role === 'assistant' ? 'Schedulify AI' : 'Tu'}
              </span>
              <div class="bubble {msg.role}-bubble">
                <p>{msg.text}</p>
              </div>
            </div>

            {#if msg.role === 'user'}
              <div class="avatar user-avatar">Tu</div>
            {/if}
          </div>
        {/each}

        {#if isTyping}
          <div class="message-row assistant">
            <div class="avatar ai-avatar">
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="currentColor"/>
              </svg>
            </div>
            <div class="message-content">
              <span class="sender-name">Schedulify AI</span>
              <div class="bubble assistant-bubble">
                <div class="typing-dots">
                  <div class="dot"></div>
                  <div class="dot"></div>
                  <div class="dot"></div>
                </div>
              </div>
            </div>
          </div>
        {/if}

        {#if error}
          <div class="error-banner">⚠️ {error}</div>
        {/if}

      </div>
    </div>

    <footer class="chat-input-area">
      <div class="input-inner">
        <form class="chat-form" onsubmit={handleSend}>
          <input
            type="text"
            placeholder="Întreabă-mă orice despre școală..."
            bind:value={inputValue}
            onkeydown={handleKeydown}
            autocomplete="off"
            disabled={isTyping}
          />
          <button type="submit" class="send-button" disabled={!inputValue.trim() || isTyping}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.53 60.53 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </form>
        <p class="disclaimer">Schedulify AI poate face greșeli. Verifică întotdeauna informațiile importante.</p>
      </div>
    </footer>
  </div>
</div>

<style>
  .page {
    --blue-950: #0a1628;
    --blue-900: #0f2347;
    --blue-600: #2563eb;
    --blue-500: #3b82f6;
    --blue-400: #60a5fa;

    font-family: 'DM Sans', sans-serif;
    height: 100vh;
    width: 100%;
    background: var(--blue-950);
    position: relative;
    overflow: hidden;
  }

  .bg-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    pointer-events: none;
    z-index: 0;
  }
  .blob-1 {
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 75%);
    top: -100px; left: 5%;
  }
  .blob-2 {
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 75%);
    bottom: -50px; right: 10%;
  }
  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(96,165,250,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(96,165,250,0.02) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
    z-index: 0;
  }

  .chat-interface {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    height: 100vh;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.5s ease-out;
  }
  .page.mounted .chat-interface {
    opacity: 1;
    transform: translateY(0);
  }

  .messages-viewport {
    flex: 1;
    overflow-y: auto;
    padding: 32px 20px;
    display: flex;
    justify-content: center;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.08) transparent;
  }

  .messages-inner {
    width: 100%;
    max-width: 780px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .suggestions-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    animation: fadeUp 0.4s ease-out forwards;
  }
  .suggestions-label {
    font-size: 0.78rem;
    color: rgba(148, 163, 184, 0.6);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    font-weight: 600;
  }
  .suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
  .suggestion-chip {
    background: rgba(37, 99, 235, 0.12);
    border: 1px solid rgba(37, 99, 235, 0.25);
    color: var(--blue-400);
    padding: 0.45rem 1rem;
    border-radius: 999px;
    font-size: 0.82rem;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .suggestion-chip:hover {
    background: rgba(37, 99, 235, 0.22);
    border-color: rgba(37, 99, 235, 0.5);
  }

  .message-row {
    display: flex;
    gap: 12px;
    align-items: flex-end;
    animation: fadeUp 0.25s ease-out forwards;
  }

  .assistant {
    align-self: flex-start;
    max-width: 75%;
  }
  .user {
    align-self: flex-end;
    flex-direction: row-reverse;
    max-width: 75%;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
    margin-bottom: 2px;
  }
  .ai-avatar {
    background: linear-gradient(135deg, var(--blue-600), var(--blue-400));
    color: white;
  }
  .user-avatar {
    background: #1e293b;
    border: 1px solid rgba(255,255,255,0.12);
    color: #94a3b8;
    font-size: 9px;
    letter-spacing: 0.02em;
  }

  .message-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .sender-name {
    font-size: 10px;
    font-weight: 700;
    color: #475569;
    font-family: 'Syne', sans-serif;
    letter-spacing: 0.04em;
    padding: 0 4px;
  }
  .user .sender-name { text-align: right; }

  .bubble {
    padding: 12px 16px;
    border-radius: 18px;
    font-size: 14.5px;
    line-height: 1.55;
    word-break: break-word;
  }

  .assistant-bubble {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    color: #e2e8f0;
    border-bottom-left-radius: 4px;
  }

  .user-bubble {
    background: var(--blue-600);
    color: white;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
    border-bottom-right-radius: 4px;
  }

  .typing-dots {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 18px;
    padding: 0 2px;
  }
  .dot {
    width: 6px; height: 6px;
    background: rgba(148,163,184,0.6);
    border-radius: 50%;
    animation: pulse 1.2s infinite ease-in-out both;
  }
  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }
  @keyframes pulse {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1.1); opacity: 1; }
  }

  .error-banner {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #fca5a5;
    padding: 10px 16px;
    border-radius: 12px;
    font-size: 0.83rem;
    text-align: center;
  }

  .chat-input-area {
    padding: 16px 20px 20px;
    background: linear-gradient(to top, var(--blue-950) 80%, transparent);
    display: flex;
    justify-content: center;
  }

  .input-inner {
    width: 100%;
    max-width: 780px;
  }

  .chat-form {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 8px 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    backdrop-filter: blur(20px);
    transition: border-color 0.2s;
  }
  .chat-form:focus-within {
    border-color: rgba(96,165,250,0.35);
  }

  .chat-form input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    padding: 8px 6px;
    font-size: 15px;
    color: white;
    font-family: 'DM Sans', sans-serif;
  }
  .chat-form input::placeholder { color: #334155; }
  .chat-form input:disabled { opacity: 0.5; }

  .send-button {
    background: white;
    color: var(--blue-950);
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: transform 0.1s, background 0.2s;
  }
  .send-button:hover:not(:disabled) {
    background: #e2e8f0;
    transform: scale(1.05);
  }
  .send-button:disabled {
    background: rgba(255,255,255,0.04);
    color: #1e293b;
    cursor: not-allowed;
  }

  .disclaimer {
    font-size: 11px;
    text-align: center;
    color: #1e293b;
    margin-top: 8px;
  }
</style>