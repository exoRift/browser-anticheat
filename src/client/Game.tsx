import { useEffect, useRef, useState } from 'react'
import { useMap } from '../hooks/useMap'
import { twMerge } from 'tailwind-merge'
import { Button } from 'react-daisyui'

import { addListener, launch, removeListener, stop } from 'devtools-detector'

/**
 * Main captcha screen
 */
export default function Game (): React.ReactNode {
  const connection = useRef<WebSocket>(undefined)

  const [loading, setLoading] = useState(true)
  const [requestingNew, setRequestingNew] = useState(false)
  const [captcha, setCaptcha] = useState<string>()
  const [valid, setValid] = useState(false)
  const [error, setError] = useState<string>()
  const heldKeys = useMap<string, boolean | null>()

  useEffect(() => setValid(false), [heldKeys.size])

  useEffect(() => {
    if (!loading) {
      /**
       * Upon opening inspector, send msg
       * @param isOpen Is the inspector open?
       */
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
      heldKeys.clear()
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
            setRequestingNew(false)
            setCaptcha(data)
            for (const key in heldKeys.keys()) heldKeys.set(key, false)
            break
          case 'CORRECT': if (heldKeys.has(data)) heldKeys.set(data, true); break
          case 'INCORRECT': if (heldKeys.has(data)) heldKeys.set(data, false); break
          case 'COMPLETE': setValid(true); break
          case 'ERROR':
            if (data === 'SET NAME FIRST') window.location.href = '/profile'
            else setError(data)
            break
        }
      })
    }, { once: true })

    connection.current.addEventListener('close', () => {
      setError((prior) => prior ?? 'The connection has been closed')
    }, { once: true })
  }, [])

  if (error) {
    return (
      <div className='text-center my-auto'>
        <h1 className='text-3xl text-error font-hatch'>Something went wrong</h1>
        <h2 className='text-lg text-base-content font-mono'>{error}</h2>
      </div>
    )
  }

  if (loading || !captcha) {
    return (
      <h1 className='text-xl text-center my-auto'>Connecting...</h1>
    )
  }

  return (
    <div className='grow flex flex-col justify-around items-center'>
      <div className='text-center'>
        <h1 className='text-2xl font-hatch'>Press and hold the keys shown below</h1>
        <h3 className='text-lg text-base-content/50'>There are no zeros</h3>
      </div>

      <img src={`/api/captcha/${captcha}`} alt='captcha' />
      <Button
        color='ghost'
        shape='circle'
        className={twMerge('symbol text-5xl size-8', requestingNew && 'animate-spin')}
        onClick={() => { setRequestingNew(true); connection.current?.send('SEQUENCE') }}
      >
        cached
      </Button>

      <ul className={twMerge('input font-mono flex justify-center', heldKeys.size && (valid ? 'border-green-300' : 'border-red-400'))}>
        {Array.from(heldKeys.entries()).map(([key, status]) => (
          <li key={key} className={twMerge(status === null ? 'text-gray-500' : status ? 'text-green-400' : 'text-red-700')}>{key}</li>
        ))}
      </ul>

      <span className='opacity-40 self-start ml-2 text-sm font-hatch'>Macs and older keyboards may not support all key combinations</span>
    </div>
  )
}
