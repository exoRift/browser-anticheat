import { useState } from 'react'
import { Input, type InputProps } from 'react-daisyui'
import { twMerge } from 'tailwind-merge'

export function HiddenInput (props: InputProps): React.ReactNode {
  const [show, setShow] = useState(false)

  return (
    <div className={twMerge('flex items-center relative', props.className)}>
      <Input {...props} className='relative w-full' type={show ? 'text' : 'password'} />

      <button
        type='button'
        className='symbol opacity-80 absolute right-1'
        onMouseDown={() => setShow(true)}
        onMouseUp={() => setShow(false)}
        onMouseLeave={() => setShow(false)}
      >
        {show ? 'visibility' : 'visibility_off'}
      </button>
    </div>
  )
}
