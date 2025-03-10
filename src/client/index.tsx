import { createRoot } from 'react-dom/client'

import Login from './Login'
import Profile from './Profile'
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
  sessionStorage.setItem('originalHref', window.location.href)
}
function onReveal (e: Event): void {
  if (sessionStorage.getItem('originalHref') === window.location.href) e.viewTransition?.skipTransition()
  sessionStorage.removeItem('originalHref')
}
window.addEventListener('pageswap', onSwap)
window.addEventListener('pagereveal', onReveal)

let Page: React.ComponentType

switch (window.location.pathname) {
  case '/profile': Page = Profile; break
  case '/': Page = Login; break
  default: Page = NotFound; break
}

root.render(
  <main className='flex flex-col h-screen'>
    <Page />
  </main>
)
