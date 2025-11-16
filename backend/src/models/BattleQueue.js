class BattleQueue {
  constructor() {
    this.players = new Map(); // socketId -> payload
    this.queue = [];
  }

  enqueue(payload) {
    if (!payload?.socketId || !payload?.userId) {
      return null;
    }
    if (this.players.has(payload.socketId)) {
      this.remove(payload.socketId);
    }
    this.players.set(payload.socketId, payload);
    this.queue.push(payload);

    if (this.queue.length >= 2) {
      const first = this.queue.shift();
      const second = this.queue.shift();
      this.players.delete(first.socketId);
      this.players.delete(second.socketId);
      return [first, second];
    }
    return null;
  }

  remove(socketId) {
    if (!socketId) {
      return false;
    }
    const beforeLength = this.queue.length;
    this.queue = this.queue.filter(player => player.socketId !== socketId);
    this.players.delete(socketId);
    return beforeLength !== this.queue.length;
  }

  clearForUser(userId) {
    if (!userId) {
      return;
    }
    this.queue = this.queue.filter(player => player.userId !== userId);
    for (const [socketId, value] of this.players.entries()) {
      if (value.userId === userId) {
        this.players.delete(socketId);
      }
    }
  }

  get size() {
    return this.queue.length;
  }
}

module.exports = BattleQueue;
