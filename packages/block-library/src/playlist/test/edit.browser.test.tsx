import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { createBlock } from '@wordpress/blocks';
import type { BlockEditProps } from '@wordpress/blocks';
import type { ComponentType } from 'react';
import { useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { initializeEditor } from '@wordpress/integration-tests/helpers/integration-test-editor';
// @ts-expect-error `@wordpress/block-library` does not expose type declarations for its entry point.
import { registerCoreBlocks } from '@wordpress/block-library';

const audioUrl = new URL(
	'../../../../../test/e2e/assets/playlist-e2e-test.wav',
	import.meta.url
).href;

let registry: ReturnType< typeof useRegistry >;

async function setup() {
	await initializeEditor(
		{
			name: 'core/playlist',
			innerBlocks: [ 'Beta', 'Alpha', 'Gamma' ].map( ( title ) =>
				createBlock( 'core/playlist-track', { src: audioUrl, title } )
			),
		},
		false,
		{}
	);
	await userEvent.click(
		page.getByLabelText( 'Block: Playlist', { exact: true } )
	);
}

function trackTitles() {
	return registry
		.select( blockEditorStore )
		.getBlocks()[ 0 ]
		.innerBlocks.map( ( track ) => track.attributes.title );
}

describe( 'Playlist selectors', () => {
	beforeAll( () => {
		// Capture the isolated registry used by the integration editor.
		addFilter(
			'editor.BlockEdit',
			'test/playlist-registry',
			( BlockEdit: ComponentType< BlockEditProps > ) =>
				function WithRegistry( props: BlockEditProps ) {
					registry = useRegistry();
					return <BlockEdit { ...props } />;
				}
		);
	} );
	beforeEach( () => registerCoreBlocks() );
	afterAll( () =>
		removeFilter( 'editor.BlockEdit', 'test/playlist-registry' )
	);

	it( 'sorts tracks when users change Order', async () => {
		await setup();
		const order = page.getByRole( 'combobox', { name: 'Order' } );

		await userEvent.click( order );
		await userEvent.click(
			page.getByRole( 'option', { name: 'Descending' } )
		);

		await expect.element( order ).toHaveTextContent( 'Descending' );
		expect( trackTitles() ).toEqual( [ 'Gamma', 'Beta', 'Alpha' ] );
		expect(
			screen
				.getAllByLabelText( 'Track title' )
				.map( ( title ) => title.textContent )
		).toEqual( [ 'Gamma', 'Beta', 'Alpha' ] );

		await userEvent.click( order );
		await userEvent.click(
			page.getByRole( 'option', { name: 'Ascending' } )
		);

		await expect.element( order ).toHaveTextContent( 'Ascending' );
		expect( trackTitles() ).toEqual( [ 'Alpha', 'Beta', 'Gamma' ] );
	} );

	it( 'preserves manual track order when users reselect the current Order', async () => {
		await setup();
		const order = page.getByRole( 'combobox', { name: 'Order' } );
		await expect.element( order ).toHaveTextContent( 'Ascending' );

		await userEvent.click( order );
		await userEvent.click(
			page.getByRole( 'option', { name: 'Ascending' } )
		);

		expect( trackTitles() ).toEqual( [ 'Beta', 'Alpha', 'Gamma' ] );
	} );

	it( 'changes the waveform Shape and clears its stored value when users return to Bars', async () => {
		await setup();
		await userEvent.click( page.getByRole( 'tab', { name: 'Styles' } ) );
		const shape = page.getByRole( 'combobox', { name: 'Shape' } );

		await userEvent.click( shape );
		await userEvent.click( page.getByRole( 'option', { name: 'Line' } ) );

		await expect.element( shape ).toHaveTextContent( 'Line' );
		expect(
			registry.select( blockEditorStore ).getBlocks()[ 0 ].attributes
				.waveformStyle
		).toBe( 'line' );

		await userEvent.click( shape );
		await userEvent.click( page.getByRole( 'option', { name: 'Bars' } ) );

		await expect.element( shape ).toHaveTextContent( 'Bars' );
		expect(
			registry.select( blockEditorStore ).getBlocks()[ 0 ].attributes
				.waveformStyle
		).toBeUndefined();
	} );
} );
