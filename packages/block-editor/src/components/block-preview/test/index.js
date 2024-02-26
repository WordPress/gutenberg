/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

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
		return (
			<div
				{ ...blockPreviewProps }
				data-testid="block-preview-component"
			/>
		);
	}

	it( 'will render a block preview with minimal nesting', async () => {
		const blocks = [];
		blocks.push( createBlock( 'core/test-block' ) );

		render(
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

		const blockPreviewComponent = screen.getByTestId(
			'block-preview-component'
		);

		// Ensure the block preview class names are merged with the component's class name.
		expect( blockPreviewComponent ).toHaveClass(
			'block-editor-block-preview__live-content'
		);
		expect( blockPreviewComponent ).toHaveClass(
			'test-container-classname'
		);
		expect( blockPreviewComponent ).toHaveClass( 'components-disabled' );

		// Ensure there is no nesting between the parent component and rendered blocks.
		expect( blockPreviewComponent ).toContainElement( previewedBlock );
	} );
} );
