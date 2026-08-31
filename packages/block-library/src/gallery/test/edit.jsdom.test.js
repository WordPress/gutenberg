import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createBlock, registerBlockType } from '@wordpress/blocks';
import {
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { createElement, useEffect } from '@wordpress/element';
import {
	initializeEditor,
	selectBlock,
} from '@wordpress/integration-tests/helpers/integration-test-editor';
import { registerCoreBlocks } from '@wordpress/block-library';
import { unlock } from '../../lock-unlock';

const IMAGE_ATTRIBUTES = {
	id: 1,
	url: 'https://example.com/image.jpg',
	alt: 'Example image',
};

const VIEWPORT_STATE_INITIALIZER = 'test/viewport-state-initializer';

// The Gallery only offers its aspect ratio control when the theme or the
// defaults provide ratios to choose from.
const ASPECT_RATIO_SETTINGS = {
	__experimentalFeatures: {
		dimensions: {
			defaultAspectRatios: true,
			aspectRatios: {
				default: [
					{ name: 'Square - 1:1', slug: 'square', ratio: '1' },
					{ name: 'Wide - 16:9', slug: '16-9', ratio: '16/9' },
				],
			},
		},
	},
};

function ViewportStateInitializer() {
	const { setResponsiveEditing, setStyleStateViewport } = unlock(
		useDispatch( blockEditorStore )
	);

	useEffect( () => {
		setResponsiveEditing( true );
		setStyleStateViewport( '@mobile' );
	}, [ setResponsiveEditing, setStyleStateViewport ] );

	return createElement( 'div', useBlockProps() );
}

/**
 * Registers the core blocks up front so inner blocks can be created before the
 * editor is initialized, then renders the given block.
 *
 * @param {Object} block    Block to render, created with `createBlock`.
 * @param {Object} settings Additional editor settings.
 */
async function setup( block, settings ) {
	return initializeEditor( block, false, settings );
}

describe( 'Gallery block', () => {
	beforeEach( () => {
		registerCoreBlocks();
		registerBlockType( VIEWPORT_STATE_INITIALIZER, {
			apiVersion: 3,
			title: 'Viewport state initializer',
			category: 'text',
			supports: {
				html: false,
				inserter: false,
			},
			edit: ViewportStateInitializer,
			save: () => null,
		} );
	} );

	describe( 'Block toolbar', () => {
		test( 'does not offer alignment for an image inside a gallery', async () => {
			await setup(
				createBlock( 'core/gallery', {}, [
					createBlock( 'core/image', IMAGE_ATTRIBUTES ),
				] )
			);

			await selectBlock( 'Block: Image' );

			// The gallery lays its images out with the flex layout, which
			// permits no alignments, so the child image must not offer them.
			expect(
				screen.queryByRole( 'button', { name: 'Align block' } )
			).not.toBeInTheDocument();
		} );

		test( 'offers alignment for an image outside a gallery', async () => {
			await setup( createBlock( 'core/image', IMAGE_ATTRIBUTES ) );

			await selectBlock( 'Block: Image' );

			expect(
				screen.getByRole( 'button', { name: 'Align block' } )
			).toBeInTheDocument();
		} );
	} );

	describe( 'Layout', () => {
		const createGallery = ( attributes = {} ) =>
			createBlock( 'core/gallery', attributes, [
				createBlock( 'core/image', IMAGE_ATTRIBUTES ),
				createBlock( 'core/image', {
					...IMAGE_ATTRIBUTES,
					id: 2,
				} ),
			] );

		test( 'keeps the custom Gallery controls for the default Flex layout', async () => {
			await setup( createGallery() );
			await selectBlock( 'Block: Gallery' );

			expect(
				await screen.findByRole( 'slider', { name: 'Columns' } )
			).toBeInTheDocument();
			expect(
				screen.getByLabelText( 'Crop images to fit' )
			).toBeInTheDocument();
			expect(
				screen.queryByText( 'Min. column width' )
			).not.toBeInTheDocument();
		} );

		test( 'shows only viewport-enabled Flex Gallery settings while editing a viewport state', async () => {
			await setup( [
				createGallery(),
				createBlock( VIEWPORT_STATE_INITIALIZER ),
			] );
			await selectBlock( 'Block: Gallery' );

			expect(
				await screen.findByRole( 'slider', { name: 'Columns' } )
			).toBeInTheDocument();
			expect(
				screen.getByLabelText( 'Crop images to fit' )
			).toBeInTheDocument();
			expect(
				screen.queryByLabelText( 'Randomize order' )
			).not.toBeInTheDocument();
		} );

		test( 'does not show a Settings tab when the Gallery has no viewport-enabled controls', async () => {
			await setup( [
				createGallery( { layout: { type: 'grid' } } ),
				createBlock( VIEWPORT_STATE_INITIALIZER ),
			] );
			await selectBlock( 'Block: Gallery Grid' );

			expect(
				screen.queryByRole( 'tab', { name: 'Settings' } )
			).not.toBeInTheDocument();
			expect(
				screen.queryByLabelText( 'Crop images to fit' )
			).not.toBeInTheDocument();
		} );

		test( 'offers the aspect ratio for a viewport state in a non-Flex layout', async () => {
			await setup(
				[
					createGallery( { layout: { type: 'grid' } } ),
					createBlock( VIEWPORT_STATE_INITIALIZER ),
				],
				ASPECT_RATIO_SETTINGS
			);
			await selectBlock( 'Block: Gallery Grid' );

			// Columns and crop to fit are Flex-only, but the aspect ratio
			// applies in every layout, so the Grid Gallery has a viewport
			// setting to show.
			expect(
				await screen.findByRole( 'combobox', { name: 'Aspect ratio' } )
			).toBeInTheDocument();
			expect(
				screen.queryByLabelText( 'Crop images to fit' )
			).not.toBeInTheDocument();
		} );

		test( 'stores a viewport aspect ratio on the Gallery instead of the images', async () => {
			await setup(
				[ createGallery(), createBlock( VIEWPORT_STATE_INITIALIZER ) ],
				ASPECT_RATIO_SETTINGS
			);
			await selectBlock( 'Block: Gallery' );

			await userEvent.selectOptions(
				await screen.findByRole( 'combobox', { name: 'Aspect ratio' } ),
				'16/9'
			);

			// The ratio is rendered from the Gallery's own responsive CSS for
			// the viewport, so the images keep their base inline style.
			screen.getAllByRole( 'img' ).forEach( ( image ) => {
				expect( image ).not.toHaveStyle( { aspectRatio: '16/9' } );
			} );
			// The generated stylesheet has no accessible query to find it by.
			// eslint-disable-next-line testing-library/no-node-access
			const styleElements = document.querySelectorAll( 'style' );
			expect(
				Array.from( styleElements ).some( ( element ) =>
					element.textContent.includes(
						'aspect-ratio:16/9 !important'
					)
				)
			).toBe( true );
		} );

		test( 'preserves layout settings when switching Gallery variations', async () => {
			await setup(
				createGallery( {
					columns: 2,
					imageCrop: false,
					layout: {
						type: 'grid',
						columnCount: 4,
						minimumColumnWidth: '10rem',
					},
				} )
			);
			await selectBlock( 'Block: Gallery Grid' );

			expect(
				screen.queryByLabelText( 'Crop images to fit' )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'slider', { name: 'Columns' } )
			).not.toBeInTheDocument();
			expect(
				screen.getByRole( 'radio', { name: 'Gallery Grid' } )
			).toBeChecked();

			await userEvent.click(
				await screen.findByRole( 'radio', {
					name: 'Transform to Gallery',
				} )
			);

			// Switching layouts only changes the layout attribute. The Gallery's
			// previous Flex settings are restored when switching back.
			expect(
				screen.getByRole( 'slider', { name: 'Columns' } )
			).toHaveValue( '2' );
			expect(
				screen.getByLabelText( 'Crop images to fit' )
			).not.toBeChecked();

			await userEvent.click(
				screen.getByRole( 'radio', {
					name: 'Transform to Gallery Grid',
				} )
			);
			await userEvent.click(
				screen.getByRole( 'tab', { name: 'Styles' } )
			);

			expect(
				await screen.findByRole( 'spinbutton', { name: 'Columns' } )
			).toHaveDisplayValue( '4' );
			expect(
				await screen.findByRole( 'spinbutton', {
					name: 'Minimum column width',
				} )
			).toHaveDisplayValue( '10' );
		} );
	} );
} );
