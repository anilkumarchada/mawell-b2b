import { Injectable, Logger } from '@nestjs/common';

interface ConnectedClient {
  clientId: string;
  userId: string;
  room?: string;
  connectedAt: Date;
}

@Injectable()
export class WebsocketService {
  private readonly logger = new Logger(WebsocketService.name);
  private connectedClients: Map<string, ConnectedClient> = new Map();
  private userToClientMap: Map<string, string> = new Map();

  addClient(clientId: string, userId: string, room?: string) {
    const client: ConnectedClient = {
      clientId,
      userId,
      room,
      connectedAt: new Date(),
    };
    
    this.connectedClients.set(clientId, client);
    this.userToClientMap.set(userId, clientId);
    
    this.logger.log(`Added client ${clientId} for user ${userId} in room ${room}`);
  }

  removeClient(clientId: string) {
    const client = this.connectedClients.get(clientId);
    if (client) {
      this.userToClientMap.delete(client.userId);
      this.connectedClients.delete(clientId);
      this.logger.log(`Removed client ${clientId} for user ${client.userId}`);
    }
  }

  getClientByUserId(userId: string): string | undefined {
    return this.userToClientMap.get(userId);
  }

  getConnectedClients(): ConnectedClient[] {
    return Array.from(this.connectedClients.values());
  }

  getClientsInRoom(room: string): ConnectedClient[] {
    return Array.from(this.connectedClients.values()).filter(
      client => client.room === room
    );
  }

  isUserConnected(userId: string): boolean {
    return this.userToClientMap.has(userId);
  }

  getConnectionStats() {
    return {
      totalConnections: this.connectedClients.size,
      uniqueUsers: this.userToClientMap.size,
      rooms: this.getRoomStats(),
    };
  }

  private getRoomStats() {
    const roomStats: Record<string, number> = {};
    
    for (const client of this.connectedClients.values()) {
      if (client.room) {
        roomStats[client.room] = (roomStats[client.room] || 0) + 1;
      }
    }
    
    return roomStats;
  }
}