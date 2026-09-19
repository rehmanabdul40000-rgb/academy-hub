export const AGENT_VOICE_KEY = "academy_hub_agent_voice_enabled_v1";

export function isAgentVoiceEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AGENT_VOICE_KEY) !== "false";
}

export function setAgentVoiceEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AGENT_VOICE_KEY, String(enabled));
  window.dispatchEvent(new CustomEvent("academy-agent-voice-updated", { detail: enabled }));
}

export function speakAgentMessage(message: string): void {
  if (typeof window === "undefined" || !message.trim() || !isAgentVoiceEnabled()) return;
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message.trim());
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((voice) => /en-(PK|IN|GB|US)/i.test(voice.lang)) ||
    voices.find((voice) => /^en/i.test(voice.lang));

  if (preferred) {
    utterance.voice = preferred;
    utterance.lang = preferred.lang;
  } else {
    utterance.lang = "en-US";
  }

  window.speechSynthesis.speak(utterance);
}

export function stopAgentVoice(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
