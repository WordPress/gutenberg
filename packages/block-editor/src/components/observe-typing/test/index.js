/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useTypingObserver } from '../';
import { store as blockEditorStore } from '../../../store';

function TypingTarget() {
	const ref = useTypingObserver();
	return <div ref={ ref } data-testid="target" />;
}

describe( 'useTypingObserver', () => {
	afterEach( () => {
		dispatch( blockEditorStore ).stopTyping();
	} );

	it( 'cleans up without throwing when ownerDocument.defaultView is null', () => {
		// Reach the cleanup branch that touches `defaultView` by entering the
		// typing state before mount.
		dispatch( blockEditorStore ).startTyping();

		const { unmount } = render( <TypingTarget /> );
		const node = screen.getByTestId( 'target' );

		// Simulate the iframe being detached from its window: when the host
		// removes the iframe from the DOM mid-typing, the iframe document's
		// `defaultView` becomes `null`, which previously crashed the cleanup.
		const previousDescriptor = Object.getOwnPropertyDescriptor(
			node.ownerDocument,
			'defaultView'
		);
		Object.defineProperty( node.ownerDocument, 'defaultView', {
			configurable: true,
			value: null,
		} );

		// Spy after render so we only capture cleanup-time calls. The leak
		// being regression-tested: if the cleanup throws on `defaultView`,
		// the `removeEventListener` calls that follow it never run, leaving
		// `selectionchange` on the document and `focus`/`keydown` on the node.
		const nodeRemoveSpy = jest.spyOn( node, 'removeEventListener' );
		const docRemoveSpy = jest.spyOn(
			node.ownerDocument,
			'removeEventListener'
		);

		try {
			expect( () => unmount() ).not.toThrow();
			expect( docRemoveSpy ).toHaveBeenCalledWith(
				'selectionchange',
				expect.any( Function )
			);
			expect( nodeRemoveSpy ).toHaveBeenCalledWith(
				'focus',
				expect.any( Function )
			);
			expect( nodeRemoveSpy ).toHaveBeenCalledWith(
				'keydown',
				expect.any( Function )
			);
		} finally {
			nodeRemoveSpy.mockRestore();
			docRemoveSpy.mockRestore();
			if ( previousDescriptor ) {
				Object.defineProperty(
					node.ownerDocument,
					'defaultView',
					previousDescriptor
				);
			} else {
				delete node.ownerDocument.defaultView;
			}
		}
	} );
} );
