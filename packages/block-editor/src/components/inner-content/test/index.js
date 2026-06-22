/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InnerContent from '../';
import { BlockEditorProvider } from '../../provider';

const BLOCK_NAME = 'core/html';

// These tests inspect the raw injected DOM to verify the static markup is
// sanitized before being added to the editor canvas, so direct node access is
// intentional.
/* eslint-disable testing-library/no-node-access, testing-library/no-container, testing-library/render-result-naming-convention */

function renderWithInnerContent( innerContent ) {
	const block = createBlock( BLOCK_NAME, {}, [], innerContent );
	const { container } = render(
		<BlockEditorProvider value={ [ block ] }>
			<InnerContent clientId={ block.clientId } />
		</BlockEditorProvider>
	);
	return container.querySelector( '.block-editor-inner-content' );
}

describe( 'InnerContent', () => {
	beforeAll( () => {
		registerBlockType( BLOCK_NAME, {
			apiVersion: 3,
			title: 'Custom HTML',
			category: 'text',
			save: () => null,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( BLOCK_NAME );
	} );

	it( 'renders the static fragments into the canvas', () => {
		const root = renderWithInnerContent( [
			'<div class="banner"><h1>Static heading</h1></div>',
		] );

		expect( root.querySelector( 'h1' ) ).toHaveTextContent(
			'Static heading'
		);
	} );

	it( 'strips script elements from the static fragments', () => {
		const root = renderWithInnerContent( [
			'<div><script>window.__innerContentRan = true;</script>Safe</div>',
		] );

		expect( root.querySelector( 'script' ) ).toBeNull();
		expect( root ).toHaveTextContent( 'Safe' );
	} );

	it( 'strips inline event handlers from the static fragments', () => {
		const root = renderWithInnerContent( [
			'<button onclick="alert(1)">Click</button>',
		] );

		expect( root.querySelector( '[onclick]' ) ).toBeNull();
		expect( root.querySelector( 'button' ) ).toHaveTextContent( 'Click' );
	} );
} );

/* eslint-enable testing-library/no-node-access, testing-library/no-container, testing-library/render-result-naming-convention */
