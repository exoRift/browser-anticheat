import { useEffect, useRef, useState } from 'react'

export default function Game (): React.ReactNode {
  const [loading, setLoading] = useState(true)
  const connection = useRef<WebSocket>(undefined)

  useEffect(() => {
    setLoading(true)

    connection.current = new WebSocket('/api/connect')

    connection.current.once('open', () => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading) connection.current?.send('SEQUENCE')
  }, [loading])

  if (loading) {
    return (
      <h1 className='text-xl text-center self-center'>Connecting...</h1>
    )
  }
}
