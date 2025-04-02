import { useEffect, useRef, useState } from 'react'
import { useMap } from '../hooks/useMap'
import { twMerge } from 'tailwind-merge'
import { Button } from 'react-daisyui'

import { addListener, launch, removeListener, stop } from 'devtools-detector'

export default function Game (): React.ReactNode {
  const connection = useRef<WebSocket>(undefined)

  const [loading, setLoading] = useState(true)
  const [captcha, setCaptcha] = useState<string>()
  const [valid, setValid] = useState(false)
  const heldKeys = useMap<string, boolean | null>()

  useEffect(() => setValid(false), [heldKeys.size])

  useEffect(() => {
    if (!loading) {
      function onOpen (isOpen: boolean): void {
        if (isOpen) connection.current?.send('INSPECT')
      }

      addListener(onOpen)
      launch()

      return () => {
        removeListener(onOpen)
        stop()
      }
    }
  }, [loading])

  useEffect(() => {
    const aborter = new AbortController()

    document.addEventListener('keydown', (e) => {
      const key = e.key.toUpperCase()
      if (key.length > 1 || heldKeys.has(key)) return

      heldKeys.set(key, null)
      connection.current?.send(`DOWN:${key}`)
    }, { signal: aborter.signal })
    document.addEventListener('keyup', (e) => {
      const key = e.key.toUpperCase()
      if (key.length > 1) return

      connection.current?.send(`UP:${key}`)
      heldKeys.delete(key)
    }, { signal: aborter.signal })
    window.addEventListener('blur', () => {
      connection.current?.send('BLUR')
    }, { signal: aborter.signal })
    window.addEventListener('focus', () => {
      connection.current?.send('FOCUS')
    }, { signal: aborter.signal })

    return () => aborter.abort()
  }, [])

  useEffect(() => {
    setLoading(true)

    connection.current = new WebSocket('/api/connect')

    connection.current.addEventListener('open', () => {
      setLoading(false)
      connection.current?.send('SEQUENCE')
      connection.current?.addEventListener('message', (e) => {
        const [command, data] = e.data.toString().split(':')

        switch (command) {
          case 'SEQUENCE':
            setCaptcha(data)
            for (const key in heldKeys.keys()) heldKeys.set(key, false)
            break
          case 'CORRECT': if (heldKeys.has(data)) heldKeys.set(data, true); break
          case 'INCORRECT': if (heldKeys.has(data)) heldKeys.set(data, false); break
          case 'COMPLETE': setValid(true); break
        }
      })
    }, { once: true })
  }, [])

  if (loading || !captcha) {
    return (
      <h1 className='text-xl text-center self-center'>Connecting...</h1>
    )
  }

  return (
    <div className='grow flex flex-col justify-around items-center'>
      <div className='text-center'>
        <h1 className='text-2xl'>Press and hold the keys shown below</h1>
        <h3 className='text-lg text-base-content/50'>There are no zeros</h3>
      </div>

      <img src={`/api/captcha/${captcha}`} alt='captcha' />
      <Button color='ghost' shape='circle' className='symbol text-5xl size-8' onClick={() => connection.current?.send('SEQUENCE')}>cached</Button>

      <ul className={twMerge('input font-mono flex justify-center', heldKeys.size && (valid ? 'border-green-300' : 'border-red-400'))}>
        {Array.from(heldKeys.entries()).map(([key, status]) => (
          <li key={key} className={twMerge(status === null ? 'text-gray-500' : status ? 'text-green-400' : 'text-red-700')}>{key}</li>
        ))}
      </ul>

      <span className='opacity-40 self-start ml-2 text-sm'>Macs and older keyboards may not support all key combinations</span>
    </div>
  )
}
