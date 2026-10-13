import { beforeEach, describe, expect, test } from 'vitest';
import { screen, within } from '@testing-library/react';
import {
	initializeEditor,
	selectBlock,
} from '@wordpress/integration-tests/helpers/integration-test-editor';
import { registerCoreBlocks } from '@wordpress/block-library';

async function setup( attributes ) {
	const view = await initializeEditor(
		{ name: 'core/file', attributes },
		false
	);
	await selectBlock( 'Block: File' );
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

describe( 'File block', () => {
	beforeEach( () => registerCoreBlocks() );

	describe( 'Media panel', () => {
		test( 'offers media from the inspector in the setup state', async () => {
			await setup( {} );
			const panel = await getMediaPanel();

			expect(
				panel.getByRole( 'button', { name: 'Add file' } )
			).toBeInTheDocument();
		} );

		test( 'shows the filename and a reset once a file is set', async () => {
			await setup( { href: 'http://localhost/my-doc.pdf', id: 7 } );
			const panel = await getMediaPanel();

			expect(
				panel.getByRole( 'button', { name: 'my-doc.pdf' } )
			).toBeInTheDocument();
			expect(
				panel.getByRole( 'button', { name: 'Reset' } )
			).toBeInTheDocument();
		} );
	} );

	describe( 'Block toolbar', () => {
		test( 'offers media in the setup state, labelled "Add file"', async () => {
			await setup( {} );
			const toolbar = await getToolbar();

			expect(
				toolbar.getByRole( 'button', { name: 'Add file' } )
			).toBeInTheDocument();
		} );

		test( 'reads "Replace" once a file is set', async () => {
			await setup( { href: 'http://localhost/my-doc.pdf', id: 7 } );
			const toolbar = await getToolbar();

			expect(
				toolbar.getByRole( 'button', { name: 'Replace' } )
			).toBeInTheDocument();
		} );
	} );
} );
