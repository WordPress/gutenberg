import { beforeEach, describe, expect, test } from 'vitest';
import { screen, within } from '@testing-library/react';
import {
	initializeEditor,
	selectBlock,
} from '@wordpress/integration-tests/helpers/integration-test-editor';
import { registerCoreBlocks } from '@wordpress/block-library';

async function setup( attributes ) {
	const view = await initializeEditor(
		{ name: 'core/audio', attributes },
		false
	);
	await selectBlock( 'Block: Audio' );
	return view;
}

async function getMediaPanel() {
	const heading = await screen.findByRole( 'heading', { name: 'Media' } );
	return within( heading.closest( '[data-wp-component="ToolsPanel"]' ) );
}

// The inspector offers the same labels, so scope to the block toolbar.
async function getToolbar() {
	return within( await screen.findByRole( 'toolbar' ) );
}

describe( 'Audio block', () => {
	beforeEach( () => registerCoreBlocks() );

	describe( 'Media panel', () => {
		test( 'offers media from the inspector in the setup state', async () => {
			await setup( {} );
			const panel = await getMediaPanel();

			expect(
				panel.getByRole( 'button', { name: 'Add audio' } )
			).toBeInTheDocument();
		} );

		test( 'shows the filename and a reset once audio is set', async () => {
			await setup( { src: 'http://localhost/my-audio.mp3', id: 7 } );
			const panel = await getMediaPanel();

			expect(
				panel.getByRole( 'button', { name: 'my-audio.mp3' } )
			).toBeInTheDocument();
			expect(
				panel.getByRole( 'button', { name: 'Reset' } )
			).toBeInTheDocument();
		} );
	} );

	describe( 'Block toolbar', () => {
		test( 'offers media in the setup state, labelled "Add audio"', async () => {
			await setup( {} );
			const toolbar = await getToolbar();

			expect(
				toolbar.getByRole( 'button', { name: 'Add audio' } )
			).toBeInTheDocument();
		} );

		test( 'reads "Replace" once audio is set', async () => {
			await setup( { src: 'http://localhost/my-audio.mp3', id: 7 } );
			const toolbar = await getToolbar();

			expect(
				toolbar.getByRole( 'button', { name: 'Replace' } )
			).toBeInTheDocument();
		} );
	} );
} );
