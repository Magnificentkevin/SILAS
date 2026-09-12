const OVERLAY_HOST_ATTR = 'data-silas-overlay-host';

export interface ContextAdapterHandle {
  readonly shadowRoot: ShadowRoot;
  readonly iframe: HTMLIFrameElement;
  send: (message: unknown) => void;
  onMessage: (handler: (message: unknown) => void) => () => void;
  unmount: () => void;
}

/**
 * Attaches a closed-mode Shadow DOM overlay to a host page element, with
 * the overlay's own content living inside an iframe — a genuinely separate
 * browsing context — reachable only via asynchronous postMessage, never
 * direct DOM/JS access. Mechanism family A (context boundary) from the
 * Patent Core Audit.
 */
export class ContextAdapter {
  mount(hostElement: Element): ContextAdapterHandle {
    const container = document.createElement('div');
    container.setAttribute(OVERLAY_HOST_ATTR, '');
    hostElement.appendChild(container);

    const shadowRoot = container.attachShadow({ mode: 'closed' });

    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'silas-overlay');
    shadowRoot.appendChild(iframe);

    const send = (message: unknown): void => {
      iframe.contentWindow?.postMessage(message, '*');
    };

    // The security-critical half of the IPC boundary: only messages whose
    // event.source is this exact mounted overlay's iframe are ever passed
    // to the handler — a message event fired by any other script on the
    // host page, no matter how similar, is silently ignored.
    const onMessage = (handler: (message: unknown) => void): (() => void) => {
      const listener = (event: MessageEvent): void => {
        if (event.source !== iframe.contentWindow) return;
        handler(event.data);
      };
      window.addEventListener('message', listener);
      return () => window.removeEventListener('message', listener);
    };

    const unmount = (): void => {
      container.remove();
    };

    return { shadowRoot, iframe, send, onMessage, unmount };
  }
}
