import { createRoot } from 'react-dom/client'

import Main from './Main'

import './style/index.css'

const node = document.getElementById('root')!
const root = createRoot(node)

root.render(<Main />)
