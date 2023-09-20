/**
 * WordPress dependencies
 */
import { expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';

/**
 * Internal dependencies
 */
import { readFile } from '../utils.js';
export class PerfUtils {
	constructor( { page } ) {
		this.page = page;
		this.browser = page.context().browser();
	}

	async getCanvas() {
		// Handles both legacy and iframed canvas.
		return await Promise.any( [
			( async () => {
				const legacyCanvasLocator = this.page.locator(
					'.wp-block-post-content'
				);
				await legacyCanvasLocator.waitFor( {
					timeout: 120_000,
				} );
				return legacyCanvasLocator;
			} )(),
			( async () => {
				const iframedCanvasLocator = this.page.frameLocator(
					'[name=editor-canvas]'
				);
				await iframedCanvasLocator
					.locator( 'body' )
					.waitFor( { timeout: 120_000 } );
				return iframedCanvasLocator;
			} )(),
		] );
	}

	async saveDraft() {
		await this.page
			.getByRole( 'button', { name: 'Save draft' } )
			.click( { timeout: 60_000 } );
		await expect(
			this.page.getByRole( 'button', { name: 'Saved' } )
		).toBeDisabled();

		return this.page.url();
	}

	async disableAutosave() {
		await this.page.evaluate( () => {
			return window.wp.data
				.dispatch( 'core/editor' )
				.updateEditorSettings( {
					autosaveInterval: 100000000000,
					localAutosaveInterval: 100000000000,
				} );
		} );

		const { autosaveInterval } = await this.page.evaluate( () => {
			return window.wp.data.select( 'core/editor' ).getEditorSettings();
		} );

		expect( autosaveInterval ).toBe( 100000000000 );
	}

	async enterSiteEditorEditMode() {
		const canvas = await this.getCanvas();

		await canvas.locator( 'body' ).click();
		// Second click is needed for the legacy edit mode.
		await canvas
			.getByRole( 'document', { name: /Block:( Post)? Content/ } )
			.click();

		return canvas;
	}

	async loadBlocksForSmallPostWithContainers() {
		return await this.loadBlocksFromHtml(
			path.join(
				process.env.ASSETS_PATH,
				'small-post-with-containers.html'
			)
		);
	}

	async loadBlocksForLargePost() {
		return await this.loadBlocksFromHtml(
			path.join( process.env.ASSETS_PATH, 'large-post.html' )
		);
	}

	async loadBlocksFromHtml( filepath ) {
		if ( ! fs.existsSync( filepath ) ) {
			throw new Error( `File not found: ${ filepath }` );
		}

		return await this.page.evaluate( ( html ) => {
			const { parse } = window.wp.blocks;
			const { dispatch } = window.wp.data;
			const blocks = parse( html );

			blocks.forEach( ( block ) => {
				if ( block.name === 'core/image' ) {
					delete block.attributes.id;
					delete block.attributes.url;
				}
			} );

			dispatch( 'core/block-editor' ).resetBlocks( blocks );
		}, readFile( filepath ) );
	}

	async load1000Paragraphs() {
		await this.page.evaluate( () => {
			const { createBlock } = window.wp.blocks;
			const { dispatch } = window.wp.data;
			const blocks = Array.from( { length: 1000 } ).map( () =>
				createBlock( 'core/paragraph' )
			);
			dispatch( 'core/block-editor' ).resetBlocks( blocks );
		} );
	}
}
