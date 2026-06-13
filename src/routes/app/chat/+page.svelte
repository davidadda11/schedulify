<script lang="ts">
  import { onMount, tick } from 'svelte';

  // --- STĂRI SVELTE 5 ---
  let messages = $state([
    { id: 1, role: 'assistant', text: 'Salut! Cu ce te pot ajuta astăzi cu privire la orar sau teme?' }
  ]);
  let inputValue = $state('');
  let isTyping = $state(false);
  let chatContainer: HTMLElement | null = $state(null);
  let mounted = $state(false);

  // Auto-scroll la ultimul mesaj
  async function scrollToBottom() {
    await tick();
    if (chatContainer) {
      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  async function handleSend(e: Event) {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    messages = [...messages, { id: Date.now(), role: 'user', text: userText }];
    inputValue = '';
    await scrollToBottom();

    isTyping = true;
    await scrollToBottom();

    // Simulare răspuns AI
    setTimeout(async () => {
      isTyping = false;
      messages = [...messages, {
        id: Date.now() + 1,
        role: 'assistant',
        text: `Am primit mesajul tău: "${userText}". Interfața pe bule și direcții este gata!`
      }];
      await scrollToBottom();
    }, 1200);
  }

  onMount(() => {
    setTimeout(() => { mounted = true; }, 100);
    scrollToBottom();
  });
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="page" class:mounted>
  <div class="bg-blob blob-1"></div>
  <div class="bg-blob blob-2"></div>
  <div class="grid-overlay"></div>

  <div class="chat-interface">
    <div class="messages-viewport" bind:this={chatContainer}>
      <div class="centered-content">
        {#each messages as msg (msg.id)}
          <div class="message-row {msg.role}">
            <div class="avatar">
              {msg.role === 'assistant' ? '🤖' : 'U'}
            </div>
            <div class="message-content">
              <span class="sender-name">{msg.role === 'assistant' ? 'Sheludify AI' : 'Tu'}</span>
              <div class="bubble">
                <p>{msg.text}</p>
              </div>
            </div>
          </div>
        {/each}

        {#if isTyping}
          <div class="message-row assistant">
            <div class="avatar">🤖</div>
            <div class="message-content">
              <span class="sender-name">Sheludify AI</span>
              <div class="bubble">
                <div class="typing-dots">
                  <div class="dot"></div>
                  <div class="dot"></div>
                  <div class="dot"></div>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <footer class="chat-input-area">
      <div class="centered-content">
        <form class="chat-form" onsubmit={handleSend}>
          <input 
            type="text" 
            placeholder="Trimite un mesaj către Sheludify AI..." 
            bind:value={inputValue}
            autocomplete="off"
          />
          <button type="submit" class="send-button" disabled={!inputValue.trim()}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.53 60.53 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </form>
        <p class="input-disclaimer">AI-ul poate face greșeli. Verifică informațiile importante din orar.</p>
      </div>
    </footer>
  </div>
</div>

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .page {
    --blue-950: #0a1628;
    --blue-900: #0f2347;
    --blue-600: #2563eb;
    --blue-500: #3b82f6;
    
    font-family: 'DM Sans', sans-serif;
    height: 100vh;
    width: 100%;
    background: var(--blue-950);
    position: relative;
    overflow: hidden;
  }

  /* Blobs & Grid */
  .bg-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    pointer-events: none;
    z-index: 0;
  }
  .blob-1 { width: 600px; height: 600px; background: radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 75%); top: -100px; left: 5%; }
  .blob-2 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 75%); bottom: -50px; right: 10%; }
  
  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(96,165,250,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.02) 1px, transparent 1px);
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
    width: 100%;
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
    padding: 40px 20px;
    display: flex;
    justify-content: center;
  }

  .centered-content {
    width: 100%;
    max-width: 850px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* ALINIERI CONFIGURABILE (Stânga vs Dreapta) */
  .message-row {
    display: flex;
    gap: 14px;
    max-width: 75%;
    align-items: flex-end;
    animation: fadeIn 0.25s ease-out forwards;
  }

  /* 👈 TU (USER) EȘTI ÎN STÂNGA */
  .user {
    align-self: flex-start;
  }
  .user .bubble {
    background: var(--blue-900);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #f1f5f9;
    border-bottom-left-radius: 4px;
  }
  .user .sender-name {
    text-align: left;
  }

  /* 👉 AI-UL (ASSISTANT) ESTE ÎN DREAPTA */
  .assistant {
    align-self: flex-end;
    flex-direction: row-reverse; /* Întoarce ordinea: bula în stânga avatarului */
  }
  .assistant .bubble {
    background: var(--blue-600);
    color: white;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
    border-bottom-right-radius: 4px;
  }
  .assistant .sender-name {
    text-align: right;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* AVATARE */
  .avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    flex-shrink: 0;
    margin-bottom: 2px;
  }
  .assistant .avatar {
    background: linear-gradient(135deg, var(--blue-500), #60a5fa);
    color: white;
  }
  .user .avatar {
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #cbd5e1;
  }

  /* CONȚINUT ȘI BULE */
  .message-content {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .sender-name {
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
    font-family: 'Syne', sans-serif;
    letter-spacing: 0.03em;
    padding: 0 4px;
  }

  .bubble {
    padding: 14px 18px;
    border-radius: 18px;
    font-size: 15px;
    line-height: 1.5;
    word-break: break-word;
  }

  /* PUNCTE TYPING ALB-ALBASTRU */
  .typing-dots {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 20px;
    padding: 0 4px;
  }
  .typing-dots .dot {
    width: 6px;
    height: 6px;
    background: white;
    border-radius: 50%;
    animation: pulse 1.2s infinite ease-in-out both;
  }
  .typing-dots .dot:nth-child(1) { animation-delay: -0.32s; }
  .typing-dots .dot:nth-child(2) { animation-delay: -0.16s; }

  @keyframes pulse {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
    40% { transform: scale(1.2); opacity: 1; }
  }

  /* CASĂ INPUT */
  .chat-input-area {
    padding: 20px;
    background: linear-gradient(to top, var(--blue-950) 80%, transparent);
    display: flex;
    justify-content: center;
  }

  .chat-form {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    backdrop-filter: blur(20px);
    transition: border-color 0.2s;
  }

  .chat-form:focus-within {
    border-color: rgba(96, 165, 250, 0.4);
  }

  .chat-form input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    padding: 8px;
    font-size: 16px;
    color: white;
    font-family: 'DM Sans', sans-serif;
  }

  .chat-form input::placeholder {
    color: #475569;
  }

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
    transition: transform 0.1s, background 0.2s;
  }

  .send-button:hover:not(:disabled) {
    background: #e2e8f0;
  }

  .send-button:disabled {
    background: rgba(255, 255, 255, 0.02);
    color: #334155;
    cursor: not-allowed;
  }

  .input-disclaimer {
    font-size: 11px;
    text-align: center;
    color: #334155;
    margin-top: 10px;
  }
</style>