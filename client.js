// dsh-prompt-enhancer — browser half.
// Mirrors WorkBuddy's enhance-prompt control: idle -> running -> done(revert)
// with cancel, content-drift guard, and a one-click restore of the original.
// Sits in conversation.input.right (renders immediately before the model picker),
// matching the WorkBuddy composer layout.
window.__ModuleLoader__.load({
  id: 'dsh-prompt-enhancer',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useCallback, useRef, useEffect } = React

    const API = '/api/prompt-enhancer'
    const SLOT = 'conversation.input.right'

    const DICT = {
      zh: {
        enhance: '增强提示词',
        busy: '增强中…（点此取消）',
        revert: '恢复原文',
        reverted: '已恢复原文',
        revertFailed: '恢复失败',
        enhanced: '已增强（可恢复原文）',
        needDraft: '请先输入一点内容',
        noSetDraft: '当前界面不支持写入输入框',
        noUseInput: '读不到输入框内容',
        draftChanged: '草稿已改动，未覆盖',
        failCopy: '写入失败，结果已复制',
        failed: '增强失败',
        hint: '增强提示词：把草稿改写为更清晰具体的提示词',
      },
      en: {
        enhance: 'Enhance prompt',
        busy: 'Enhancing… (click to cancel)',
        revert: 'Restore original',
        reverted: 'Original restored',
        revertFailed: 'Restore failed',
        enhanced: 'Enhanced (can restore)',
        needDraft: 'Type something first',
        noSetDraft: 'This view cannot write to the composer',
        noUseInput: 'Cannot read the composer',
        draftChanged: 'Draft changed — result discarded',
        failCopy: 'Write failed, result copied',
        failed: 'Enhance failed',
        hint: 'Enhance prompt: rewrite the draft into a clearer, more specific prompt',
      },
    }

    function lang() {
      try { return (navigator.language || 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en' } catch { return 'en' }
    }
    function readDraft(state) {
      if (state == null) return ''
      if (typeof state === 'string') return state
      if (typeof state !== 'object') return ''
      for (const k of ['draft', 'text', 'value', 'content']) if (typeof state[k] === 'string') return state[k]
      return ''
    }
    function copyText(text) {
      try {
        if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(text); return }
      } catch {}
      try {
        const ta = document.createElement('textarea')
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove()
      } catch {}
    }
    function SparkIcon() {
      return h('svg', { viewBox: '0 0 16 16', width: 15, height: 15, fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        h('path', { d: 'M10.9 1.6 12 4.6l3 1.1-3 1.1-1.1 3-1.1-3-3-1.1 3-1.1z' })
      )
    }
    function RevertIcon() {
      return h('svg', { viewBox: '0 0 16 16', width: 15, height: 15, fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        h('path', { d: 'M3 8h7a3 3 0 0 1 0 6H7' }),
        h('path', { d: 'M5.5 5.5 3 8l2.5 2.5' })
      )
    }

    function EnhanceButton(props) {
      const t = DICT[lang()]
      const useInput = typeof props.useInput === 'function' ? props.useInput : null
      const inputActions = props.inputActions
      const sessionId = props.sessionId
      const draft = useInput ? (useInput(s => readDraft(s)) || '') : null

      const [busy, setBusy] = useState(false)
      const [notice, setNotice] = useState('')
      const [backup, setBackup] = useState(null)   // original text
      const [result, setResult] = useState(null)   // enhanced text we wrote
      const abortRef = useRef(null)
      const draftRef = useRef('')
      draftRef.current = draft == null ? draftRef.current : draft

      useEffect(() => { setBusy(false); setNotice(''); setBackup(null); setResult(null) }, [sessionId])
      useEffect(() => () => { const a = abortRef.current; if (a) a.abort() }, [])

      const canRevert = backup !== null && result !== null && draft === result
      const onClick = useCallback(async () => {
        if (busy) { const a = abortRef.current; if (a) a.abort(); return }
        if (canRevert) {
          try { inputActions.setDraft(backup); setBackup(null); setResult(null); setNotice(t.reverted) }
          catch { setNotice(t.revertFailed) }
          return
        }
        if (!useInput) { setNotice(t.noUseInput); return }
        if (typeof inputActions?.setDraft !== 'function') { setNotice(t.noSetDraft); return }
        const before = draftRef.current
        if (!before || before.trim() === '') { setNotice(t.needDraft); return }
        const controller = new AbortController()
        abortRef.current = controller
        setBusy(true); setNotice('')
        try {
          const res = await fetch(API, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ text: before }),
            signal: controller.signal,
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(data.error || data.code || ('HTTP ' + res.status))
          if (!data.success || !data.text) throw new Error(data.error || 'enhance failed')
          // content-drift guard: if user typed during the call, discard result.
          if (draftRef.current !== before) { setNotice(t.draftChanged); return }
          try {
            inputActions.setDraft(data.text)
            setBackup(before); setResult(data.text)
          } catch {
            copyText(data.text); setNotice(t.failCopy)
          }
        } catch (error) {
          if (error && error.name === 'AbortError') return
          setNotice(t.failed + (error?.message ? ': ' + error.message : ''))
        } finally {
          if (abortRef.current === controller) abortRef.current = null
          setBusy(false)
        }
      }, [busy, canRevert, useInput, inputActions, t])

      const glyph = canRevert ? h(RevertIcon) : h(SparkIcon)
      const label = busy ? t.busy : canRevert ? t.revert : t.enhance
      const title = notice || (busy ? t.busy : canRevert ? t.enhanced : t.hint)
      const style = {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26, padding: 0,
        border: 'none', background: 'transparent', color: 'inherit',
        font: 'inherit', lineHeight: 1, cursor: 'pointer',
        opacity: busy ? 0.55 : 1,
      }
      return h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 6 } },
        h('button', { type: 'button', 'aria-label': label, title, disabled: false, style, onClick }, glyph),
        notice ? h('span', { title: notice, style: { fontSize: 11, opacity: 0.8, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, notice) : null
      )
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject(SLOT, () => ctx.slots.register({ name: SLOT, id: 'prompt-enhancer', order: 20 }, EnhanceButton))
      },
    }
  },
})
