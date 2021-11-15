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
			save: () => <div>Test block save view</div>,
			edit: () => <div>Test block edit view</div>,
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

	it( 'will render a block preview with minimal nesting', () => {
		const blocks = [];
		blocks.push( createBlock( 'core/test-block' ) );

		const { container } = render(
			<BlockPreviewComponent
				className="test-container-classname"
				blocks={ blocks }
			/>
		);

		// Test block and block contents are rendered.
		const previewedBlock = screen.queryByLabelText( 'Block: test block' );
		const previewedBlockContents = screen.getByText(
			'Test block edit view'
		);
		expect( previewedBlockContents ).toBeInTheDocument();

		// Ensure the block preview class names are merged with the component's class name.
		expect( container.firstChild.className ).toBe(
			'test-container-classname block-editor-block-preview__live-content components-disabled'
		);

		// Ensure there is no nesting between the parent component and rendered blocks.
		expect( container.firstChild.firstChild ).toBe( previewedBlock );
	} );
} );
