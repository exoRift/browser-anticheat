import type { WebsocketRequestHandler } from 'express-ws'

/**
 * Connect to the Anticheat websocket
 * @param socket The socket
 * @param req    The request
 */
export const ws: WebsocketRequestHandler = function ws (socket, req): void {
  if (!req.session?.valid) return socket.terminate()
  const meta = req.state.sessions.metadata.get(req.session.id)
  if (!meta) {
    socket.send('ERROR:NONEXISTENT SESSION')
    socket.close()
    return
  }
  if (!meta.name) {
    socket.send('ERROR:SET NAME FIRST')
    socket.close()
    return
  }

  req.state.sessions.registerSocket(req.session, socket)
  console.log(`${meta.name} connects`)
}
