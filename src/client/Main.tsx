import { createContext, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import { Button, Form } from 'react-daisyui'
import { HiddenInput } from './components/HiddenInput'

interface SessionContextType {
  id?: string
}

const SessionContext = createContext<[SessionContextType, React.Dispatch<React.SetStateAction<SessionContextType>>]>([{}, () => {}])

export default function Main (): React.ReactNode {
  const [session, setSession] = useState<SessionContextType>({})

  return (
    <main className='flex flex-col h-screen'>
      <SessionContext.Provider value={[session, setSession]}>
        {session.id
          ? <Engager />
          : <Entry />}
      </SessionContext.Provider>
    </main>
  )
}

function Engager (): React.ReactNode {
  
}

function Entry (): React.ReactNode {
  const loggedIn = document.cookie.includes('session')

  if (loggedIn) return <Engager />

  const invalid = window.location.search.includes('invalid')
  return (
    <Form className='flex flex-col gap-8 md:w-96 my-auto self-center rounded-2xl glass [--glass-reflect-degree:190deg] [--glass-opacity:0.1] backdrop-blur-sm p-8' action='/api/join' method='POST'>
      <div>
        <h1 className='text-center text-3xl font-semibold font-hatch'>Enter the passcode provided by the Game Master</h1>
        <h2 className='text-center text-xl italic font-hatch text-base-content/50'>(or leave it blank if there is no password)</h2>
      </div>

      <div className='space-y-1'>
        <label htmlFor='passcode' className='block'>Passcode</label>
        <HiddenInput id='passcode' name='passcode' placeholder='Enter passcode here...' className={twMerge(invalid && '[&_input]:border-error')} />
        {invalid && <label className='text-error'>Passcode incorrect</label>}
      </div>

      <Button color='primary' className='self-end group/btn' type='submit'>
        Submit
        <div className='symbol transition-transform group-hover/btn:translate-x-0.5'>arrow_forward</div>
      </Button>
    </Form>
  )
}
