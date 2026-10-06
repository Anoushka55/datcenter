// Multi-turn conversational API for the K-Nexus operations copilot. The system
// prompt is the Nexus operating record, built from the dataset per request.
import { copilotSystemPrompt } from '@/lib/nexus/copilot-context';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { content: 'Conversational answers are unavailable right now. Every figure is still on the command centre, incident and predictive pages.' },
      { status: 200 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { messages = [] } = body;

  if (!messages.length) {
    return Response.json({ error: 'messages array is required.' }, { status: 400 });
  }

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        system: copilotSystemPrompt(),
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return Response.json({ error: err.error?.message || `Assistant unavailable (${res.status})` }, { status: res.status });
    }

    const data = await res.json();
    // The panel renders plain text; drop any emphasis markers that slip through.
    const content = (data.content[0]?.type === 'text' ? data.content[0].text : '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/^#+\s*/gm, '');
    return Response.json({ content });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
