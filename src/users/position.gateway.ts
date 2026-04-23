import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UsersService } from './users.service';

interface UpdatePositionPayload {
  userId: string;
  latitude: number;
  longitude: number;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class PositionGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly usersService: UsersService) {}

  @SubscribeMessage('update-position')
  async handleUpdatePosition(
    @MessageBody() payload: UpdatePositionPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.usersService.updatePosition(
      payload.userId,
      payload.latitude,
      payload.longitude,
    );
    client.emit('position-updated', { userId: payload.userId });
  }
}
