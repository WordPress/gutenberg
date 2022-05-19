/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unregisterBlockType,
	createBlock,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { useBlockPreview } from '../';

jest.mock( '@wordpress/dom', () => {
	const focus = jest.requireActual( '../../../../../dom/src' ).focus;

	return {
		focus: {
			...focus,
			focusable: {
				...focus.focusable,
				find( context ) {
					// In JSDOM, all elements have zero'd widths and height.
					// This is a metric for focusable's `isVisible`, so find
					// and apply an arbitrary non-zero width.
					Array.from( context.querySelectorAll( '*' ) ).forEach(
						( element ) => {
							Object.defineProperties( element, {
								offsetWidth: {
									get: () => 1,
									configurable: true,
								},
							} );
						}
					);

					return focus.focusable.find( ...arguments );
				},
			},
		},
	};
} );

jest.useRealTimers();

describe( 'useBlockPreview', () => {
	beforeAll( () => {
		registerBlockType( 'core/test-block', {
			save: () => (
				<div>
					Test block save view
					<button>Button</button>
				</div>
			),
			edit: () => (
				<div>
					Test block edit view
					<button>Button</button>
				</div>
			),
			category: 'text',
			title: 'test block',
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/test-block' );
	} );

	function BlockPreviewComponent( { blocks, className } ) {
		const blockPreviewProps = useBlockPreview( {
			blocks,
			props: { className },
		} );
		return <div { ...blockPreviewProps } />;
	}

	it( 'will render a block preview with minimal nesting', async () => {
		const blocks = [];
		blocks.push( createBlock( 'core/test-block' ) );

		const { container } = render(
			<BlockPreviewComponent
				className="test-container-classname"
				blocks={ blocks }
			/>
		);

		// Test block and block contents are rendered.
		const previewedBlock = screen.getByLabelText( 'Block: test block' );
		const previewedBlockContents = screen.getByText(
			'Test block edit view'
		);
		expect( previewedBlockContents ).toBeInTheDocument();

		// Test elements within block contents are disabled.
		await waitFor( () => {
			const button = screen.getByText( 'Button' );
			expect( button.hasAttribute( 'disabled' ) ).toBe( true );
		} );

		// Ensure the block preview class names are merged with the component's class name.
		expect( container.firstChild.className ).toBe(
			'test-container-classname block-editor-block-preview__live-content components-disabled'
		);

		// Ensure there is no nesting between the parent component and rendered blocks.
		expect( container.firstChild.firstChild ).toBe( previewedBlock );
	} );
} );
