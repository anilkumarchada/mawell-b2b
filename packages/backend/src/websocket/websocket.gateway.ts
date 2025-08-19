import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WebsocketService } from './websocket.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(private readonly websocketService: WebsocketService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.websocketService.removeClient(client.id);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: { room: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`User ${data.userId} joining room ${data.room}`);
    client.join(data.room);
    this.websocketService.addClient(client.id, data.userId, data.room);
    
    return {
      event: 'joined-room',
      data: { room: data.room, message: 'Successfully joined room' },
    };
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Client ${client.id} leaving room ${data.room}`);
    client.leave(data.room);
    
    return {
      event: 'left-room',
      data: { room: data.room, message: 'Successfully left room' },
    };
  }

  @SubscribeMessage('location-update')
  handleLocationUpdate(
    @MessageBody() data: { latitude: number; longitude: number; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Location update from user ${data.userId}`);
    
    // Broadcast location update to relevant rooms
    client.broadcast.emit('location-updated', {
      userId: data.userId,
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp: new Date().toISOString(),
    });
    
    return {
      event: 'location-update-received',
      data: { message: 'Location updated successfully' },
    };
  }

  // Method to send notifications to specific users or rooms
  sendNotification(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  // Method to send notifications to specific user
  sendToUser(userId: string, event: string, data: any) {
    const clientId = this.websocketService.getClientByUserId(userId);
    if (clientId) {
      this.server.to(clientId).emit(event, data);
    }
  }
}