// Real-time data streaming and synchronization
import io from 'socket.io-client';
import intelligentCache from './intelligentCache';

class RealTimeManager {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.isConnected = false;
    this.messageQueue = [];
    this.syncState = {
      lastSync: Date.now(),
      pendingSyncs: new Set(),
      conflictResolution: 'server-wins' // 'client-wins', 'merge', 'prompt-user'
    };
  }

  // Initialize connection with auto-reconnect
  connect(userId, token) {
    const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:5111';
    
    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay
    });

    this.setupEventHandlers(userId);
    this.setupRealtimeDataSync();
  }

  setupEventHandlers(userId) {
    this.socket.on('connect', () => {
      console.log('🔗 Real-time connection established');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Join user-specific room
      this.socket.emit('join-user-room', userId);
      
      // Process queued messages
      this.processMessageQueue();
      
      // Sync any pending changes
      this.syncPendingChanges();
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('🔌 Real-time connection lost:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      this.handleReconnection();
    });

    // Real-time data event handlers
    this.setupDataEventHandlers();
  }

  setupDataEventHandlers() {
    // User updates
    this.socket.on('user-updated', (data) => {
      this.handleRealtimeUpdate('user', data);
    });

    // Activity updates
    this.socket.on('activity-updated', (data) => {
      this.handleRealtimeUpdate('activity', data);
    });

    this.socket.on('activity-created', (data) => {
      this.handleRealtimeUpdate('activity-new', data);
    });

    // Message updates
    this.socket.on('message-received', (data) => {
      this.handleRealtimeUpdate('message', data);
    });

    // Friend updates
    this.socket.on('friend-request', (data) => {
      this.handleRealtimeUpdate('friend-request', data);
    });

    this.socket.on('friend-accepted', (data) => {
      this.handleRealtimeUpdate('friend-accepted', data);
    });

    // Notification updates
    this.socket.on('notification', (data) => {
      this.handleRealtimeUpdate('notification', data);
    });

    // Bulk sync events for performance
    this.socket.on('bulk-sync', (data) => {
      this.handleBulkSync(data);
    });
  }

  // Handle real-time updates with intelligent cache integration
  handleRealtimeUpdate(type, data) {
    console.log(`📡 Real-time update: ${type}`, data);

    const handlers = {
      user: (userData) => {
        intelligentCache.update(`user:${userData.id}`, userData, {
          invalidateTags: ['user', 'profile']
        });
        this.notifyListeners('user-updated', userData);
      },

      activity: (activityData) => {
        intelligentCache.update(`activity:${activityData.id}`, activityData, {
          invalidateTags: ['activity', 'list']
        });
        this.notifyListeners('activity-updated', activityData);
      },

      'activity-new': (activityData) => {
        // Invalidate activity lists to show new activity
        intelligentCache.invalidateByTags(['activity-list', 'recommendations']);
        this.notifyListeners('activity-created', activityData);
      },

      message: (messageData) => {
        // Update conversation cache
        const conversationKey = `conversation:${messageData.conversationId}`;
        const conversation = intelligentCache.get(conversationKey);
        
        if (conversation) {
          conversation.messages.push(messageData);
          conversation.lastMessage = messageData;
          conversation.updatedAt = messageData.createdAt;
          
          intelligentCache.update(conversationKey, conversation);
        }

        this.notifyListeners('message-received', messageData);
      },

      'friend-request': (requestData) => {
        intelligentCache.invalidateByTags(['friends', 'requests']);
        this.notifyListeners('friend-request-received', requestData);
      },

      'friend-accepted': (friendData) => {
        intelligentCache.invalidateByTags(['friends', 'social']);
        this.notifyListeners('friend-request-accepted', friendData);
      },

      notification: (notificationData) => {
        // Add to notifications cache
        const notifications = intelligentCache.get('user:notifications') || [];
        notifications.unshift(notificationData);
        
        intelligentCache.update('user:notifications', notifications.slice(0, 50), {
          ttl: 5 * 60 * 1000 // 5 minutes
        });

        this.notifyListeners('notification-received', notificationData);
      }
    };

    const handler = handlers[type];
    if (handler) {
      handler(data);
    }
  }

  // Handle bulk synchronization for performance
  handleBulkSync(syncData) {
    console.log('📦 Processing bulk sync:', syncData);

    const { type, items, lastSyncTime } = syncData;

    switch (type) {
      case 'activities':
        items.forEach(activity => {
          intelligentCache.set(`activity:${activity.id}`, activity, {
            ttl: 10 * 60 * 1000,
            tags: ['activity', 'bulk-sync']
          });
        });
        this.notifyListeners('activities-bulk-updated', items);
        break;

      case 'messages':
        // Group messages by conversation
        const conversationGroups = items.reduce((groups, message) => {
          const convId = message.conversationId;
          if (!groups[convId]) groups[convId] = [];
          groups[convId].push(message);
          return groups;
        }, {});

        Object.entries(conversationGroups).forEach(([convId, messages]) => {
          const conversation = intelligentCache.get(`conversation:${convId}`) || { messages: [] };
          conversation.messages.push(...messages);
          conversation.lastMessage = messages[messages.length - 1];
          
          intelligentCache.update(`conversation:${convId}`, conversation);
        });

        this.notifyListeners('messages-bulk-updated', items);
        break;

      case 'friends':
        intelligentCache.update('user:friends', items, {
          ttl: 15 * 60 * 1000,
          tags: ['friends', 'bulk-sync']
        });
        this.notifyListeners('friends-bulk-updated', items);
        break;
    }

    this.syncState.lastSync = lastSyncTime || Date.now();
  }

  // Setup periodic data synchronization
  setupRealtimeDataSync() {
    // Sync every 30 seconds for critical data
    setInterval(() => {
      if (this.isConnected) {
        this.requestSync('critical');
      }
    }, 30000);

    // Sync every 2 minutes for regular data
    setInterval(() => {
      if (this.isConnected) {
        this.requestSync('regular');
      }
    }, 120000);
  }

  // Request data synchronization from server
  requestSync(syncType = 'regular') {
    if (!this.isConnected) return;

    const syncRequest = {
      type: syncType,
      lastSync: this.syncState.lastSync,
      requestId: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.socket.emit('request-sync', syncRequest);
    this.syncState.pendingSyncs.add(syncRequest.requestId);

    console.log(`🔄 Requested ${syncType} sync:`, syncRequest.requestId);
  }

  // Send real-time updates to server
  sendUpdate(type, data) {
    const update = {
      type,
      data,
      timestamp: Date.now(),
      clientId: this.getClientId()
    };

    if (this.isConnected) {
      this.socket.emit('client-update', update);
    } else {
      // Queue for later if disconnected
      this.messageQueue.push({ event: 'client-update', data: update });
    }
  }

  // Optimistic updates with conflict resolution
  optimisticUpdate(type, id, updateFn, rollbackFn) {
    const originalData = intelligentCache.get(`${type}:${id}`);
    
    try {
      // Apply optimistic update
      const updatedData = updateFn(originalData);
      intelligentCache.update(`${type}:${id}`, updatedData);
      
      // Send to server
      this.sendUpdate(`${type}-update`, { id, ...updatedData });
      
      // Store rollback info
      const rollbackKey = `rollback:${type}:${id}`;
      intelligentCache.set(rollbackKey, { originalData, rollbackFn }, {
        ttl: 30000, // 30 seconds
        priority: 'high'
      });

      return updatedData;
    } catch (error) {
      console.error('Optimistic update failed:', error);
      if (rollbackFn) rollbackFn(originalData);
      throw error;
    }
  }

  // Handle server update conflicts
  handleUpdateConflict(type, id, serverData, clientData) {
    const resolution = this.syncState.conflictResolution;

    switch (resolution) {
      case 'server-wins':
        intelligentCache.update(`${type}:${id}`, serverData);
        this.notifyListeners('conflict-resolved', { type, id, resolution: 'server', data: serverData });
        break;

      case 'client-wins':
        this.sendUpdate(`${type}-force-update`, { id, ...clientData });
        break;

      case 'merge':
        const mergedData = this.mergeData(serverData, clientData);
        intelligentCache.update(`${type}:${id}`, mergedData);
        this.sendUpdate(`${type}-merge-update`, { id, ...mergedData });
        break;

      case 'prompt-user':
        this.notifyListeners('conflict-detected', {
          type, id, serverData, clientData,
          resolve: (chosenData) => {
            intelligentCache.update(`${type}:${id}`, chosenData);
            if (chosenData === clientData) {
              this.sendUpdate(`${type}-force-update`, { id, ...chosenData });
            }
          }
        });
        break;
    }
  }

  // Simple data merging strategy
  mergeData(serverData, clientData) {
    // Prefer server data for most fields, but keep client timestamps if newer
    const merged = { ...serverData };
    
    if (clientData.updatedAt && serverData.updatedAt) {
      if (new Date(clientData.updatedAt) > new Date(serverData.updatedAt)) {
        merged.updatedAt = clientData.updatedAt;
      }
    }

    return merged;
  }

  // Event listener management
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
      }
    };
  }

  notifyListeners(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Connection management
  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.socket.emit(message.event, message.data);
    }
  }

  syncPendingChanges() {
    // Implementation for syncing changes made while offline
    console.log('🔄 Syncing pending changes...');
  }

  handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.reconnect();
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.notifyListeners('connection-failed', {
        message: 'Unable to establish real-time connection'
      });
    }
  }

  reconnect() {
    if (this.socket) {
      this.socket.connect();
    }
  }

  getClientId() {
    let clientId = localStorage.getItem('client-id');
    if (!clientId) {
      clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('client-id', clientId);
    }
    return clientId;
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.listeners.clear();
    this.messageQueue = [];
  }

  // Performance monitoring
  getConnectionStats() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      activeListeners: Array.from(this.listeners.entries()).map(([event, listeners]) => ({
        event,
        count: listeners.size
      })),
      lastSync: this.syncState.lastSync,
      pendingSyncs: this.syncState.pendingSyncs.size
    };
  }
}

// Create global instance
const realTimeManager = new RealTimeManager();

export default realTimeManager;
