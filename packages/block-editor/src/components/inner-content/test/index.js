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
import { useEffect } from '@wordpress/element';

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

	it( 'keeps the slot nodes when the shell re-renders', () => {
		const block = createBlock( BLOCK_NAME, {}, [], [] );
		const shellA =
			'<div class="shell-a"><wp-inner-block-slot data-slot-index="0"></wp-inner-block-slot></div>';
		const shellB =
			'<div class="shell-b"><wp-inner-block-slot data-slot-index="0"></wp-inner-block-slot></div>';
		const { container, rerender } = render(
			<BlockEditorProvider value={ [ block ] }>
				<InnerContent clientId={ block.clientId } html={ shellA } />
			</BlockEditorProvider>
		);
		const root = container.querySelector( '.block-editor-inner-content' );
		const slot = root.querySelector( 'wp-inner-block-slot' );

		rerender(
			<BlockEditorProvider value={ [ block ] }>
				<InnerContent clientId={ block.clientId } html={ shellB } />
			</BlockEditorProvider>
		);

		// The new shell is injected, but the slot node survives, so the
		// portalled blocks move with it instead of remounting.
		expect( root.querySelector( '.shell-b' ) ).not.toBeNull();
		expect( root.querySelector( '.shell-a' ) ).toBeNull();
		expect( root.querySelector( 'wp-inner-block-slot' ) ).toBe( slot );
	} );

	it( 'mounts provided children only once, inside the slot', () => {
		const block = createBlock( BLOCK_NAME, {}, [], [] );
		const onMount = jest.fn();
		function Probe() {
			useEffect( () => {
				onMount();
			}, [] );
			return <span className="probe" />;
		}
		const shell =
			'<div class="shell"><wp-inner-block-slot data-slot-index="0"></wp-inner-block-slot></div>';
		const { container } = render(
			<BlockEditorProvider value={ [ block ] }>
				<InnerContent clientId={ block.clientId } html={ shell }>
					<Probe />
				</InnerContent>
			</BlockEditorProvider>
		);
		const root = container.querySelector( '.block-editor-inner-content' );

		// Mounting inline first and swapping into the portal would call the
		// mount effect twice.
		expect( onMount ).toHaveBeenCalledTimes( 1 );
		expect(
			root.querySelector( 'wp-inner-block-slot .probe' )
		).not.toBeNull();
	} );

	it( 'uses the `html` prop verbatim instead of building from innerContent', () => {
		const block = createBlock(
			BLOCK_NAME,
			{},
			[],
			[ '<p class="from-inner-content">derived</p>' ]
		);
		const shell =
			'<div class="ssr-shell"><wp-inner-block-slot data-slot-index="0"></wp-inner-block-slot></div>';
		const { container } = render(
			<BlockEditorProvider value={ [ block ] }>
				<InnerContent clientId={ block.clientId } html={ shell } />
			</BlockEditorProvider>
		);
		const root = container.querySelector( '.block-editor-inner-content' );

		// The provided shell (and its slot) is injected as-is...
		expect( root.querySelector( '.ssr-shell' ) ).not.toBeNull();
		expect( root.querySelector( 'wp-inner-block-slot' ) ).not.toBeNull();
		// ...and the innerContent-derived markup is ignored.
		expect( root.querySelector( '.from-inner-content' ) ).toBeNull();
	} );
} );

/* eslint-enable testing-library/no-node-access, testing-library/no-container, testing-library/render-result-naming-convention */
