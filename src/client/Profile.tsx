import type { Profile } from '../server/controllers/profile'

import { useFetch } from '../hooks/useFetch'

import { Button, Form } from 'react-daisyui'

export default function Profile (): React.ReactNode {
  const {
    state,
    result: { name } = { name: undefined }
  } = useFetch<Profile>((signal) =>
    fetch('/api/profile', { signal, method: 'GET', headers: { Accept: 'application/json' } }).then((res) => res.json())
  , [])

  return (
    <Form className='flex flex-col gap-8 md:w-96 my-auto self-center rounded-2xl glass [--glass-reflect-degree:190deg] [--glass-opacity:0.1] backdrop-blur-sm p-8' action='/api/profile' method='POST'>
      <h1 className='text-center text-3xl font-semibold font-hatch'>Your Profile</h1>

      <div className='space-y-1'>
        <label htmlFor='name' className='block'>Your Name</label>
        <input className='input' name='name' defaultValue={name} placeholder={state === 'loading' ? 'Loading...' : undefined} disabled={state === 'loading'} />
      </div>

      <div className='flex gap-2 justify-end'>
        <Button color='success' type='submit'>
          Save
          <div className='symbol'>check</div>
        </Button>
        <Button color='primary' tag='a' href='/game' disabled={!name}>
          Go to Game
          <div className='symbol transition-transform [button:enabled:hover>&]:translate-x-0.5'>arrow_forward</div>
        </Button>
      </div>
    </Form>
  )
}
