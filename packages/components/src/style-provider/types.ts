import type { ReactNode } from 'react';

export type StyleProviderProps = {
	/**
	 * The children elements.
	 */
	children: ReactNode;
	/**
	 * Current document.
	 */
	document: Document;
	/**
	 * A nonce to add to the `<style>` elements that package styles are
	 * injected with, for documents with a Content Security Policy that only
	 * allows styles with a matching nonce.
	 *
	 * It can also be set for every `StyleProvider`, including the ones
	 * rendered by `Modal`, `Popover` and `Fill`, through the context system
	 * under the `StyleProvider` namespace.
	 */
	nonce?: string;
};
