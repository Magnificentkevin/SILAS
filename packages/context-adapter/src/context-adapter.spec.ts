import { describe, expect, it } from 'vitest';
import { ContextAdapter } from './context-adapter.js';

function makeHost(): HTMLDivElement {
  const host = document.createElement('div');
  document.body.appendChild(host);
  return host;
}

describe('ContextAdapter', () => {
  describe('mount', () => {
    it('adds exactly one new node to the host element and leaves existing content untouched', () => {
      const adapter = new ContextAdapter();
      const host = makeHost();
      host.innerHTML = '<p id="existing">host page content</p>';

      adapter.mount(host);

      expect(host.children).toHaveLength(2);
      expect(host.querySelector('#existing')?.textContent).toBe('host page content');
    });

    it('attaches a closed shadow root — inaccessible to other scripts on the host page', () => {
      const adapter = new ContextAdapter();
      const host = makeHost();

      const handle = adapter.mount(host);

      // The adapter's own handle legitimately holds the reference...
      expect(handle.shadowRoot).toBeDefined();
      // ...but an unrelated script on the host page querying the DOM node
      // directly gets nothing, because the shadow root is closed.
      const overlayContainer = host.querySelector('[data-silas-overlay-host]');
      expect(overlayContainer?.shadowRoot).toBeNull();
    });

    it("mounts an iframe inside the shadow root as the overlay's isolated realm", () => {
      const adapter = new ContextAdapter();
      const host = makeHost();

      const handle = adapter.mount(host);

      expect(handle.iframe.tagName).toBe('IFRAME');
      expect(handle.shadowRoot.contains(handle.iframe)).toBe(true);
    });
  });

  describe('send', () => {
    it('posts a message into the overlay iframe, delivered asynchronously', async () => {
      const adapter = new ContextAdapter();
      const host = makeHost();
      const handle = adapter.mount(host);

      const received = await new Promise((resolve) => {
        handle.iframe.contentWindow?.addEventListener('message', (event) => resolve(event.data));
        handle.send({ from: 'host' });
      });

      expect(received).toEqual({ from: 'host' });
    });
  });

  describe('unmount', () => {
    it('removes the overlay from the host element', () => {
      const adapter = new ContextAdapter();
      const host = makeHost();
      const handle = adapter.mount(host);

      handle.unmount();

      expect(host.querySelector('[data-silas-overlay-host]')).toBeNull();
    });
  });

  describe('onMessage', () => {
    it('invokes the handler for a message whose source is the mounted overlay iframe', () => {
      const adapter = new ContextAdapter();
      const host = makeHost();
      const handle = adapter.mount(host);

      const received: unknown[] = [];
      handle.onMessage((message) => received.push(message));

      window.dispatchEvent(
        new MessageEvent('message', { data: { from: 'overlay' }, source: handle.iframe.contentWindow }),
      );

      expect(received).toEqual([{ from: 'overlay' }]);
    });

    it('does not invoke the handler for a spoofed message whose source is not the mounted overlay iframe', () => {
      const adapter = new ContextAdapter();
      const host = makeHost();
      const handle = adapter.mount(host);

      const received: unknown[] = [];
      handle.onMessage((message) => received.push(message));

      // Simulates an unrelated script elsewhere on the host page firing its
      // own message event, hoping to be mistaken for the overlay.
      window.dispatchEvent(new MessageEvent('message', { data: { from: 'attacker' }, source: window }));

      expect(received).toEqual([]);
    });

    it('stops invoking the handler once the returned unsubscribe function is called', () => {
      const adapter = new ContextAdapter();
      const host = makeHost();
      const handle = adapter.mount(host);

      const received: unknown[] = [];
      const unsubscribe = handle.onMessage((message) => received.push(message));
      unsubscribe();

      window.dispatchEvent(
        new MessageEvent('message', { data: { from: 'overlay' }, source: handle.iframe.contentWindow }),
      );

      expect(received).toEqual([]);
    });
  });
});
