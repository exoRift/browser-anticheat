import type { WebsocketRequestHandler } from 'express-ws'

export const ws: WebsocketRequestHandler = function ws (socket, req) {
  if (!req.session?.valid) return socket.terminate()
  if (!req.session.name) {
    socket.send('ERROR:SET NAME FIRST')
    socket.close()
    return
  }

  req.state.sessions.registerSocket(req.session, socket)
}
