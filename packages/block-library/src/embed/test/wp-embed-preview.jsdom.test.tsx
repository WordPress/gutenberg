import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WpEmbedPreview from '../wp-embed-preview';

const html =
	'<iframe title="Post" data-secret="abc" src="https://example.com/embed/"></iframe>';

function postMessage( data: unknown ) {
	window.dispatchEvent( new MessageEvent( 'message', { data } ) );
}

describe( 'WpEmbedPreview', () => {
	// jsdom reports errors thrown by event listeners instead of rethrowing them.
	const onError = vi.fn( ( event: ErrorEvent ) => event.preventDefault() );

	beforeEach( () => {
		onError.mockClear();
		window.addEventListener( 'error', onError );
	} );

	afterEach( () => {
		window.removeEventListener( 'error', onError );
	} );

	test( 'resizes the iframe on a height message with its secret', () => {
		render( <WpEmbedPreview html={ html } /> );

		postMessage( { secret: 'abc', message: 'height', value: 300 } );

		expect( screen.getByTitle( 'Post' ) ).toHaveAttribute(
			'height',
			'300'
		);
	} );

	test( 'ignores a height message with another secret', () => {
		render( <WpEmbedPreview html={ html } /> );

		postMessage( { secret: 'xyz', message: 'height', value: 300 } );

		expect( screen.getByTitle( 'Post' ) ).not.toHaveAttribute( 'height' );
	} );

	test.each( [ null, undefined, 'a string' ] )(
		'ignores a message with %s data',
		( data ) => {
			render( <WpEmbedPreview html={ html } /> );

			postMessage( data );

			expect( onError ).not.toHaveBeenCalled();
		}
	);
} );
