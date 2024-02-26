/**
 * WordPress dependencies
 */
import { expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import type { Locator, Page } from '@playwright/test';

/**
 * Internal dependencies
 */
import { readFile } from '../utils.js';

type PerfUtilsConstructorProps = {
	page: Page;
};

export class PerfUtils {
	page: Page;

	constructor( { page }: PerfUtilsConstructorProps ) {
		this.page = page;
	}

	/**
	 * Returns the locator for the editor canvas element. This supports both the
	 * legacy and the iframed canvas.
	 *
	 * @param canvasLocator
	 * @return Locator for the editor canvas element.
	 */
	async getCanvas(
		canvasLocator = this.page.locator(
			'.wp-block-post-content, iframe[name=editor-canvas]'
		)
	) {
		const isFramed = await canvasLocator.evaluate(
			( node ) => node.tagName === 'IFRAME'
		);

		if ( isFramed ) {
			return canvasLocator.frameLocator( ':scope' );
		}

		return canvasLocator;
	}

	/**
	 * Saves the post as a draft and returns its URL.
	 *
	 * @return URL of the saved draft.
	 */
	async saveDraft() {
		await this.page.getByRole( 'button', { name: 'Save draft' } ).click();
		await expect(
			this.page.getByRole( 'button', { name: 'Saved' } )
		).toBeDisabled();

		const postId = new URL( this.page.url() ).searchParams.get( 'post' );

		return postId;
	}

	/**
	 * Disables the editor autosave function.
	 */
	async disableAutosave() {
		await this.page.waitForFunction( () => window?.wp?.data );

		await this.page.evaluate( () => {
			return window.wp.data
				.dispatch( 'core/editor' )
				.updateEditorSettings( {
					autosaveInterval: 100000000000,
					localAutosaveInterval: 100000000000,
				} );
		} );
	}

	/**
	 * Enters the Site Editor's edit mode.
	 *
	 * @return Locator for the editor canvas element.
	 */
	async enterSiteEditorEditMode() {
		const canvas = await this.getCanvas();

		await canvas.locator( 'body' ).click();
		await canvas
			.getByRole( 'document', { name: /Block:( Post)? Content/ } )
			.click();

		return canvas;
	}

	/**
	 * Loads blocks from the small post with containers fixture into the editor
	 * canvas.
	 */
	async loadBlocksForSmallPostWithContainers() {
		return await this.loadBlocksFromHtml(
			path.join(
				process.env.ASSETS_PATH!,
				'small-post-with-containers.html'
			)
		);
	}

	/**
	 * Loads blocks from the large post fixture into the editor canvas.
	 */
	async loadBlocksForLargePost() {
		return await this.loadBlocksFromHtml(
			path.join( process.env.ASSETS_PATH!, 'large-post.html' )
		);
	}

	/**
	 * Loads blocks from an HTML fixture with given path into the editor canvas.
	 *
	 * @param filepath Path to the HTML fixture.
	 */
	async loadBlocksFromHtml( filepath: string ) {
		if ( ! fs.existsSync( filepath ) ) {
			throw new Error( `File not found: ${ filepath }` );
		}

		await this.page.waitForFunction(
			() => window?.wp?.blocks && window?.wp?.data
		);

		return await this.page.evaluate( ( html: string ) => {
			const { parse } = window.wp.blocks;
			const { dispatch } = window.wp.data;
			const blocks = parse( html );

			blocks.forEach( ( block: any ) => {
				if ( block.name === 'core/image' ) {
					delete block.attributes.id;
					delete block.attributes.url;
				}
			} );

			dispatch( 'core/block-editor' ).resetBlocks( blocks );
		}, readFile( filepath ) );
	}

	/**
	 * Generates and loads a 1000 empty paragraphs into the editor canvas.
	 */
	async load1000Paragraphs() {
		await this.page.waitForFunction(
			() => window?.wp?.blocks && window?.wp?.data
		);

		await this.page.evaluate( () => {
			const { createBlock } = window.wp.blocks;
			const { dispatch } = window.wp.data;
			const blocks = Array.from( { length: 1000 } ).map( () =>
				createBlock( 'core/paragraph' )
			);
			dispatch( 'core/block-editor' ).resetBlocks( blocks );
		} );
	}

	async expectExpandedState( locator: Locator, state: 'true' | 'false' ) {
		return await Promise.any( [
			// eslint-disable-next-line playwright/missing-playwright-await
			expect( locator ).toHaveAttribute( 'aria-expanded', state ),
			// Legacy selector.
			// eslint-disable-next-line playwright/missing-playwright-await
			expect( locator ).toHaveAttribute( 'aria-pressed', state ),
		] );
	}
}
