import { createContext, useState } from 'react'
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
  const [token, setToken] = useState()

  return (
    <Form className='flex flex-col gap-8 w-96 my-auto self-center rounded-2xl bg-secondary/20 backdrop-blur-sm p-8'>
      <h1 className='text-center text-3xl font-semibold font-hatch'>Enter the passcode provided by the Game Master</h1>

      <div className='space-y-1'>
        <label htmlFor='passcode' className='block text-secondary-content'>Passcode</label>
        <HiddenInput id='passcode' name='passcode' placeholder='Enter passcode here...' />
      </div>

      <Button color='primary' className='self-end' type='submit'>
        Submit
        <div className='symbol'>arrow_forward</div>
      </Button>
    </Form>
  )
}
