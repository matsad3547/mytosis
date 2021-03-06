/* eslint-env mocha */
import expect, { spyOn } from 'expect';
import { Graph, Node } from 'graph-crdt';
import database from '../../index';
import { Storage } from './mocks';

describe('A storage plugin', () => {
  let db, storage;

  beforeEach(() => {
    storage = new Storage();

    db = database({
      storage: [storage],
    });
  });

  context('write', () => {
    let write;

    beforeEach(() => {
      write = spyOn(storage, 'write').andCallThrough();
    });

    it('should be given a graph', async () => {
      await db.write('users', {});

      expect(write).toHaveBeenCalled();
      const [graph] = write.calls[0].arguments;
      expect(graph).toBeA(Graph);
    });

    it('should contain complete node state', async () => {

      // Write two partial updates.
      await db.write('state', { original: true });
      await db.write('state', { update: true });

      // Assert full in-memory state.
      expect(write.calls.length).toBe(2);

      const [graph] = write.calls[1].arguments;
      const node = graph.value('state');

      expect([...node]).toEqual([
        ['original', true],
        ['update', true],
      ]);
    });

    it('should be passed node updates', async () => {
      const profile = await db.write('profile', {
        name: 'Bob Carlson VII',
      });

      expect(write.calls.length).toBe(1);
      await profile.write('username', 'SuperBob');
      expect(write.calls.length).toBe(2);
    });

    it('should be passed the options object', async () => {
      await db.write('users', {}, {
        potatoes: true,
      });

      const [, options] = write.calls[0].arguments;
      expect(options).toContain({
        potatoes: true,
      });
    });

    it('should not be called if storage is disabled', async () => {
      await db.write('users', {}, {
        storage: [],
      });
      expect(write).toNotHaveBeenCalled();
    });

  });

  context('read', () => {
    let read, graph, node;

    beforeEach(() => {
      read = spyOn(storage, 'read').andCallThrough();

      graph = new Graph();
      node = new Node();
    });

    it('should be used to retrieve state', async () => {
      node.merge({ from: 'storage' });
      graph.merge({ [node]: node });

      await storage.write(graph);

      const result = await db.read(node.toString());
      expect(read).toHaveBeenCalled();
      expect(result).toBeA(Node);

      expect([...result]).toEqual([
        ['from', 'storage'],
      ]);
    });

    it('should not be called if the value is cached', async () => {
      await db.write('stuff', { value: 'probably' });
      await db.read('stuff');
      expect(read).toNotHaveBeenCalled();
    });

    it('should cache read results', async () => {
      node.merge({ from: 'storage' });
      graph.merge({ [node]: node });
      await storage.write(graph);

      expect(read.calls.length).toBe(0);

      // First read.
      await db.read(node.toString());
      expect(read.calls.length).toBe(1);

      // Second read.
      await db.read(node.toString());
      expect(read.calls.length).toBe(1);
    });

    it('should be passed the options object', async () => {
      await db.read('key', { potatoes: true });
      const [, options] = read.calls[0].arguments;
      expect(options).toBeAn(Object);
      expect(options).toContain({ potatoes: true });
    });

    it('should not be called if storage is disabled', async () => {
      await db.read('key', { storage: [] });
      expect(read).toNotHaveBeenCalled();
    });

  });

});
