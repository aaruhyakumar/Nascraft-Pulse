const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

export async function groqChat(prompt: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'system',
          content: 'You are a workforce productivity analyst. Be concise, specific, and actionable. Use plain text only — no markdown, no bullet symbols, just clean paragraphs.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.7,
    }),
  })

  if (!res.ok) throw new Error('Groq API error')
  const data = await res.json()
  return data.choices[0].message.content.trim()
}
