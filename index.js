// dsh-prompt-enhancer — WorkBuddy enhance-prompt, integrated.
// Prompts Ur/Wr: verbatim from WorkBuddy 5.11.3 server.js (unchanged).
// Everything else (host architecture, composer button, state machine) follows
// the two proven DSH implementations (dsh-prompt-enhance + dsh-prompt-forge),
// which are themselves aligned with WorkBuddy's own UI behaviour.

const ROUTE = '/api/prompt-enhancer'

export const name = 'prompt-enhancer'
// No hard inject: read services lazily so activation never parks on a
// not-yet-ready service (the exact failure mode of earlier iterations).
export const inject = []

// ---- Verbatim from source: server.js Ur (systemPrompt) ----
const UR = "You are a Prompt Engineering Expert specializing in improving user prompts for a development code assistant. When given a prompt, analyze and enhance it to create a more effective version while maintaining its core purpose. The requests are being made to an AI assistant that specializes in writing code.\n\n\tTASK: When given a prompt, analyze and enhance it to create a more effective version while maintaining its core purpose. The requests are being made to an AI assistant that specializes in writing code.\n\n\tANALYSIS PROCESS:\n\n\tEvaluate the original prompt:\n\tIdentify the main objective\n\tNote any ambiguities or gaps\n\tAssess the clarity of instructions\n\tCheck for missing context\n\tApply these prompt engineering principles:\n\tWrite clear, specific instructions\n\tInclude necessary context\n\tSet explicit parameters and constraints\n\tStructure the output format\n\tAdd relevant examples\n\tMatch tone and complexity to the use case\n\tRemove redundant information\n\tCreate the enhanced version:\n\tMaintain the original goal\n\tIncorporate identified improvements\n\tEnsure clarity and completeness\n\tBe realistic in the features to add\n\tDo NOT request guides/how-tos unless the user asks\n\tDo NOT ask for code snippets\n\tDo NOT suggest specific technologies unless mentioned in the user's prompt\n\tDo NOT explain HOW to do things, focus on WHAT\n\tDo NOT answer questions - expand/rewrite them to be more detailed\n\tIMPORTANT CONSTRAINTS:\n\t1. Language matching is the highest priority - You MUST strictly respond in the exact same language as the user's input. If the user writes in Chinese, respond in Chinese; if the user writes in English, respond in English; if the user uses another language, respond in that same language. Do not mix languages unless the user's input itself mixes languages.\n\t2. Keep the enhanced prompt concise - maximum length should be around 800 characters\n\tFORMAT: Provide only the enhanced prompt with no additional commentary.\n\n\tExample:\n\t\"A website for my dog\"\n\n\tEnhanced prompt:\n\t\"Design a personalized Next.js website dedicated to showcasing my dog. Include sections such as a photo gallery, a biography detailing the dog's breed, age, and personality traits, and a blog for sharing stories or updates about your dog's adventures. Add a contact form for visitors to reach out with questions or comments. Ensure the website is visually appealing and easy to navigate, with a responsive design that works well on both desktop and mobile devices.\"\n\n\tExample:\n\t\"Convert this to a friendly tone, maintain technical details but reduce bullets in favor of narrative. Remove any jargon like 'genie router'. Use canvas\"\n\n\tEnhanced prompt:\n\t\"Transform the provided content into a friendly narrative format while preserving all technical details. Minimize bullet points in favor of flowing prose. Eliminate any technical jargon such as 'genie router'. Incorporate the concept of using canvas elements naturally within the narrative structure to enhance the technical explanation.\"\n    "
// ---- Verbatim from source: server.js Wr (user template) ----
const WR = "You are a prompt enhancement assistant. Improve the user prompt while preserving its intent and language.\n\n    USER INPUT:\n    {input}\n    \n    TASK:\n    Rewrite the user input into a clearer, more specific prompt for the target AI assistant.\n\n    CRITICAL PRIORITY - LANGUAGE CONSISTENCY:\n    1. You MUST detect the language of the user input above and write the enhanced prompt in that same language.\n    2. If the user writes in Chinese, the enhanced prompt MUST be entirely in Chinese.\n    3. If the user writes in English, the enhanced prompt MUST be entirely in English.\n    4. If the user writes in any other language, the enhanced prompt MUST use that exact same language.\n    5. If the user mixes languages, keep a natural matching mix. Do not translate the user's intent into a single language.\n    6. These language rules are behavior instructions only; never include language analysis or language labels in the output.\n    \n    ENHANCEMENT REQUIREMENTS:\n    1. Return only the enhanced prompt text; do not add explanations, prefaces, markdown fences, labels, or analysis.\n    2. Do not include language labels or meta notes such as \"User input is in Chinese\" or \"Response must be in Chinese\".\n    3. Preserve the user's original intent, topic, constraints, and target output type. Do not answer the request.\n    4. Always make a substantive enhancement when possible: clarify the task, scope, constraints, and expected output.\n    5. If the original prompt is already clear, lightly polish it instead of returning it unchanged.\n    6. Keep the enhanced prompt complete and concise. Do not end with an unfinished list, dangling conjunction, or trailing colon.\n    7. Do not add unrelated requirements, unsupported facts, or unnecessary sections.\n\n    EXAMPLES:\n    User input (Chinese): \"\\u8BF7\\u5E2E\\u6211\\u89E3\\u91CA\\u8FD9\\u6BB5\\u4EE3\\u7801\\u7684\\u529F\\u80FD\"\n    Enhanced prompt: \"\\u8BF7\\u89E3\\u91CA\\u8FD9\\u6BB5\\u4EE3\\u7801\\u7684\\u4E3B\\u8981\\u529F\\u80FD\\u3001\\u6267\\u884C\\u6D41\\u7A0B\\u548C\\u5173\\u952E\\u903B\\u8F91\\uFF0C\\u5E76\\u6307\\u51FA\\u53EF\\u80FD\\u9700\\u8981\\u6CE8\\u610F\\u7684\\u8FB9\\u754C\\u60C5\\u51B5\\u3002\"\n\n    User input (English): \"Please explain what this code does\"\n    Enhanced prompt: \"Explain what this code does, including its main purpose, key control flow, and any important edge cases.\"\n\n    User input (Mixed): \"\\u8FD9\\u6BB5\\u4EE3\\u7801\\u6709 bug\\uFF0Ccan you help me fix it?\"\n    Enhanced prompt: \"\\u8BF7\\u5206\\u6790\\u8FD9\\u6BB5\\u4EE3\\u7801\\u4E2D\\u7684 bug\\uFF0Cexplain the root cause, and provide a minimal fix with necessary verification steps.\"\n\n    BAD OUTPUT EXAMPLE:\n    User input is in Chinese \\u2192 Response must be in Chinese.\n    \\u8BF7\\u89E3\\u91CA\\u8FD9\\u6BB5\\u4EE3\\u7801\\u7684\\u4E3B\\u8981\\u529F\\u80FD\n\n    GOOD OUTPUT EXAMPLE:\n    \\u8BF7\\u89E3\\u91CA\\u8FD9\\u6BB5\\u4EE3\\u7801\\u7684\\u4E3B\\u8981\\u529F\\u80FD\\u3001\\u6267\\u884C\\u6D41\\u7A0B\\u548C\\u5173\\u952E\\u903B\\u8F91\\uFF0C\\u5E76\\u6307\\u51FA\\u53EF\\u80FD\\u9700\\u8981\\u6CE8\\u610F\\u7684\\u8FB9\\u754C\\u60C5\\u51B5\\u3002\n    "

function renderUserPrompt(text) { return WR.replace('{input}', () => text) }
// ---- Verbatim from source: stripWrappingQuotes ----
function stripWrappingQuotes(text) {
  return String(text ?? '').trim().replace(/^["'"“”‘’]|["'"“”‘']$/g, '')
}
function finalize(raw) {
  let out = stripWrappingQuotes(raw)
  // Defensive only (does not touch the VerbWorkBuddy prompt): strip an outer
  // code fence or a label line that the original model did not emit.
  const fence = new RegExp('^```[a-zA-Z0-9_-]*\\n([\\s\\S]*?)\\n```$').exec(out.trim())
  if (fence) out = fence[1].trim()
  out = out.replace(/^(?:enhanced\s+prompt|rewritten\s+prompt|增强后的?提示词|优化后的?提示词)\s*[:：]\s*/i, '')
  return out.trim()
}
function sendJson(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}
function readBody(req, max) {
  return new Promise((resolve, reject) => {
    const chunks = []; let bytes = 0
    req.on('data', c => { bytes += c.length; if (bytes > max) { reject(new Error('body too large')); req.destroy(); return } chunks.push(c) })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}
function resolveRoute(ctx, config) {
  let provider = typeof config.provider === 'string' && config.provider.trim() ? config.provider.trim() : undefined
  let model = typeof config.model === 'string' && config.model.trim() ? config.model.trim() : undefined
  try {
    const sel = ctx.get('agentDefaultModel')?.currentSelection?.()
    if (!provider) provider = sel?.provider
    if (!model) model = sel?.model
  } catch {}
  return provider && model ? { provider, model } : undefined
}
async function collectText(stream) {
  let text = '', failure
  for await (const chunk of stream) {
    if (!chunk || typeof chunk !== 'object') continue
    if (chunk.type === 'text-delta' && typeof chunk.text === 'string') { text += chunk.text; continue }
    if (chunk.type === 'finish' && chunk.reason?.kind === 'error') {
      failure = chunk.reason?.failure?.message || 'LLM completion failed'
    }
  }
  return { text, failure }
}

export function apply(ctx, config = {}) {
  async function enhance(text) {
    if (typeof text !== 'string' || text.trim() === '') return { success: false, text: '', code: 'empty_input', error: 'Empty input' }
    const llm = ctx.get('llm', false)
    if (!llm || typeof llm.stream !== 'function') return { success: false, text: '', code: 'llm_error', error: 'LLM service unavailable' }
    const route = resolveRoute(ctx, config)
    if (!route) return { success: false, text: '', code: 'llm_error', error: 'No model route selected' }
    const chunks = []
    try {
      const stream = llm.stream({
        provider: route.provider, model: route.model, system: UR,
        messages: [{ role: 'user', content: [{ type: 'text', text: renderUserPrompt(text) }] }],
      })
      for await (const chunk of stream) {
        if (chunk && chunk.type === 'text-delta' && typeof chunk.text === 'string') chunks.push(chunk.text)
      }
    } catch (error) {
      return { success: false, text: '', code: 'llm_error', error: error instanceof Error ? error.message : String(error) }
    }
    const out = finalize(chunks.join(''))
    if (!out) return { success: false, text: '', code: 'llm_error', error: 'Enhanced result is empty' }
    return { success: true, text: out }
  }

  function handler() {
    return (req, res) => {
      void (async () => {
        // same-origin trust check, fail-closed
        try {
          const connection = ctx.get('connection', false)
          const reject = connection?.requestRejection
          if (typeof reject === 'function') {
            const r = reject.call(connection, { headers: req.headers })
            if (r !== undefined && r !== null) { sendJson(res, r, { success: false, code: 'forbidden', error: 'request rejected' }); return }
          }
        } catch { sendJson(res, 403, { success: false, code: 'forbidden', error: 'request rejected' }); return }
        if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST' }); res.end(); return }
        let payload
        try {
          const raw = await readBody(req, 256 * 1024)
          payload = raw === '' ? {} : JSON.parse(raw)
        } catch (error) {
          sendJson(res, 400, { success: false, code: 'bad_request', error: String(error) }); return
        }
        const text = payload && typeof payload.text === 'string' ? payload.text : ''
        const envelope = await enhance(text)
        sendJson(res, 200, envelope)
      })().catch(error => {
        if (!res.headersSent) sendJson(res, 500, { success: false, code: 'unknown', error: String(error) })
        else res.destroy()
      })
    }
  }

  let registered = null
  function tryMount() {
    if (registered) return
    const server = ctx.get('webServer', false)
    if (!server || typeof server.register !== 'function') return
    try {
      registered = server.register({ kind: 'exact', path: ROUTE, handler: handler() })
    } catch {}
  }
  tryMount()
  ctx.inject(['webServer'], c => {
    if (!registered && c.webServer && typeof c.webServer.register === 'function') {
      try { registered = c.webServer.register({ kind: 'exact', path: ROUTE, handler: handler() }) } catch {}
    }
  })
}
