/* eslint-env mocha */
import expect, { spyOn } from 'expect';
import database from './root';
import Context from './context';

describe('A context', () => {
  let node, root;

  beforeEach(() => {
    root = database();
    node = new Context(root);
  });

  it('should expose the database root', () => {
    expect(node.root).toBe(root);
  });

  it('should accept node constructor settings', () => {
    node = new Context(root, {
      uid: 'potatoes',
    });

    const { uid } = node.meta();
    expect(uid).toBe('potatoes');
  });

  describe('read', () => {

    it('should return undefined if not found', async () => {
      const result = await node.read('nothing here');
      expect(result).toBe(undefined);
    });

    it('should return the value if it exists', async () => {
      await node.write('enabled', true);

      const enabled = await node.read('enabled');

      expect(enabled).toBe(true);
    });

    it('should resolve contexts through the root', async () => {
      const settings = new Context(root, { uid: 'settings' });
      await node.write('settings', settings);

      const read = spyOn(root, 'read');
      read.andReturn(Promise.resolve(settings));

      const result = await node.read('settings');
      expect(result).toBe(settings);

      read.restore();
    });

  });

  describe('write', () => {

    it('should write as an edge when given a context', async () => {
      const settings = new Context(root, { uid: 'settings' });
      await node.write('settings', settings);

      const { value } = node.meta('settings');
      expect(value).toEqual({ edge: 'settings' });
    });

  });

});
