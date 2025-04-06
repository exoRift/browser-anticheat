import { useEffect, useState } from 'react'

type FetchResult<T> = {
  state: 'loading'
  result: undefined
} | {
  state: 'resolved'
  result: T
} | {
  state: 'errored'
  result: undefined
}

export function useFetch<T> (fn: (signal: AbortSignal) => false | undefined | null | '' | Promise<T>, deps: React.DependencyList): FetchResult<T> {
  const [result, setResult] = useState<FetchResult<T>>({ state: 'loading', result: undefined })

  useEffect(() => {
    const aborter = new AbortController()

    setResult({ state: 'loading', result: undefined })
    const promise = fn(aborter.signal)
    if (!(promise instanceof Promise)) return

    promise
      .then((result) => setResult({ state: 'resolved', result }))
      .catch(() => {
        if (!aborter.signal.aborted) setResult({ state: 'errored', result: undefined })
      })

    return () => aborter.abort()
  }, deps)

  return result
}
