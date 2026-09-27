import { beforeEach, describe, expect, test } from 'vitest';
import { screen, act, waitFor } from '@testing-library/react';
import { initializeEditor } from '@wordpress/integration-tests/helpers/integration-test-editor';
import { registerCoreBlocks } from '@wordpress/block-library';

function paste( element, text ) {
	const clipboardData = new window.DataTransfer();
	clipboardData.setData( 'text/plain', text );
	element.dispatchEvent(
		new window.ClipboardEvent( 'paste', {
			clipboardData,
			bubbles: true,
			cancelable: true,
		} )
	);
}

describe( 'Preformatted block', () => {
	beforeEach( () => registerCoreBlocks() );

	test( 'keeps multi-line text pasted into an empty block', async () => {
		await initializeEditor( { name: 'core/preformatted' }, false );

		const block = screen.getByLabelText( 'Block: Preformatted' );
		act( () => block.focus() );
		await waitFor( () => expect( block ).toHaveClass( 'is-selected' ) );

		act( () => paste( block, 'first part\n\nsecond part' ) );
		expect( console ).toHaveLogged();

		await waitFor( () =>
			expect(
				screen.getByLabelText( 'Block: Preformatted' ).innerText
			).toBe( 'first part\n\nsecond part' )
		);
		expect(
			screen.queryByLabelText( 'Block: Paragraph' )
		).not.toBeInTheDocument();
	} );
} );
