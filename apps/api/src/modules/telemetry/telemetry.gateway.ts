import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

export interface TelemetryUpdatePayload {
  facilityId: string;
  lat: number;
  lng: number;
  isInsideGeofence: boolean;
}

function roomFor(facilityId: string): string {
  return `facility:${facilityId}`;
}

@WebSocketGateway({ namespace: 'telemetry', cors: { origin: '*' } })
export class TelemetryGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { facilityId: string }, @ConnectedSocket() client: Socket) {
    const room = roomFor(data.facilityId);
    client.join(room);
    return { joined: room };
  }

  emitTelemetryUpdate(facilityId: string, payload: TelemetryUpdatePayload) {
    this.server.to(roomFor(facilityId)).emit('telemetry:update', payload);
  }
}
