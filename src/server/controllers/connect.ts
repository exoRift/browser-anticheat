import type { WebsocketRequestHandler } from 'express-ws'

export const ws: WebsocketRequestHandler = function ws (socket, req) {
  if (!req.session) return socket.terminate()

  socket.on('message', (msg) => {
    const [command, data] = msg.toString().split(':')

    switch (command) {
      case 'SEQUENCE': {
        void req.state.sessions.getSequence(req.session!.id)
          .then((id) => socket.send('SEQUENCE:' + id))
        break
      }
    }
  })
}
