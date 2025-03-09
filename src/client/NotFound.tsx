import { Button } from 'react-daisyui'

export default function NotFound (): React.ReactNode {
  return (
    <div className='grow flex flex-col gap-8 justify-center items-center'>
      <h1 className='text-8xl font-hatch'>404</h1>
      <Button tag='a' href='/' color='primary'>
        <div className='symbol'>undo</div>
        Return to the Known
      </Button>
    </div>
  )
}
