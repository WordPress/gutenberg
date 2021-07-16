/**
 * External dependencies
 */
import {
	fireEvent,
	waitFor,
	getEditorHtml,
	within,
	initializeEditor,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

beforeAll( () => {
	// Register all core blocks
	registerCoreBlocks();
} );

afterAll( () => {
	// Clean up registered blocks
	getBlockTypes().forEach( ( block ) => {
		unregisterBlockType( block.name );
	} );
} );

describe( 'when a button is shown', () => {
	it( 'adjusts the border radius', async () => {
		const initialHtml = `<!-- wp:buttons -->
		<div class="wp-block-buttons"><!-- wp:button -->
		<div class="wp-block-button"><a class="wp-block-button__link">Hello</a></div>
		<!-- /wp:button --></div>
		<!-- /wp:buttons -->`;
		const { getByA11yLabel, getByTestId } = await initializeEditor( {
			initialHtml,
		} );

		const buttonsBlock = await waitFor( () =>
			getByA11yLabel( /Buttons Block\. Row 1/ )
		);
		fireEvent.press( buttonsBlock );

		// onLayout event has to be explicitly dispatched in BlockList component,
		// otherwise the inner blocks are not rendered.
		const innerBlockListWrapper = await waitFor( () =>
			within( buttonsBlock ).getByTestId( 'block-list-wrapper' )
		);
		fireEvent( innerBlockListWrapper, 'layout', {
			nativeEvent: {
				layout: {
					width: 100,
				},
			},
		} );

		const buttonInnerBlock = await waitFor( () =>
			within( buttonsBlock ).getByA11yLabel( /Button Block\. Row 1/ )
		);
		fireEvent.press( buttonInnerBlock );

		const settingsButton = await waitFor( () =>
			getByA11yLabel( 'Open Settings' )
		);
		fireEvent.press( settingsButton );

		const radiusSlider = await waitFor( () =>
			getByTestId( 'Slider Border Radius' )
		);
		fireEvent( radiusSlider, 'valueChange', '25' );

		const expectedHtml = `<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {"style":{"border":{"radius":25}}} -->
<div class="wp-block-button"><a class="wp-block-button__link" href="">Hello</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->`;
		expect( getEditorHtml() ).toBe( expectedHtml );
	} );
} );
