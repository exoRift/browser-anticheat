import { createRoot } from 'react-dom/client'

import Login from './Login'
import Profile from './Profile'
import NotFound from './NotFound'

import './style/index.css'

const node = document.getElementById('root')!
const root = createRoot(node)

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
