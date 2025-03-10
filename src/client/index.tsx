import { createRoot } from 'react-dom/client'

import Login from './Login'
import Profile from './Profile'
import Game from './Game'
import NotFound from './NotFound'

import './style/index.css'

const node = document.getElementById('root')!
const root = createRoot(node)

declare global {
  interface Event {
    viewTransition: ViewTransition | null
  }
}
function onSwap (): void {
  sessionStorage.setItem('original_path', window.location.pathname)
}
function onReveal (): void {
  if (sessionStorage.getItem('original_path') === window.location.pathname) document.documentElement.style.viewTransitionName = 'fade'
  sessionStorage.removeItem('original_path')
}
window.addEventListener('pageswap', onSwap)
window.addEventListener('pagereveal', onReveal)

let Page: React.ComponentType

switch (window.location.pathname) {
  case '/': Page = Login; break
  case '/profile': Page = Profile; break
  case '/game': Page = Game; break
  default: Page = NotFound; break
}

root.render(
  <main className='flex flex-col h-screen'>
    <Page />
  </main>
)
