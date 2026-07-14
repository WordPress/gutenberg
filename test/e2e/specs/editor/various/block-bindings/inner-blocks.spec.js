/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const AREA_NAME = 'Editable body';
const FALLBACK_TEXT = 'Pattern fallback paragraph';
const EDITED_TEXT = 'Pattern override paragraph';
const ADDED_TEXT = 'Paragraph added with Enter';
const EXPERIMENT_ID = 'gutenberg-pattern-overrides-inner-blocks';

function patternContent( { anchor, fallback } ) {
	return [
		`<!-- wp:group {"anchor":"${ anchor }","metadata":{"name":"${ AREA_NAME }","bindings":{"innerBlocks":{"source":"core/pattern-overrides"}}}} -->`,
		`<div id="${ anchor }" class="wp-block-group"><!-- wp:paragraph -->`,
		`<p>${ fallback }</p>`,
		'<!-- /wp:paragraph --></div>',
		'<!-- /wp:group -->',
	].join( '\n' );
}

async function createPattern( requestUtils, options ) {
	return requestUtils.createBlock( {
		title: options.title,
		content: patternContent( options ),
		status: 'publish',
	} );
}

test.describe( 'Block bindings: innerBlocks pattern overrides', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-block-bindings' );
		await requestUtils.setGutenbergExperiments( [ EXPERIMENT_ID ] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost( { title: 'InnerBlocks pattern override' } );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deleteAllBlocks(),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
		await requestUtils.deactivatePlugin( 'gutenberg-test-block-bindings' );
	} );

	test( 'creates an innerBlocks override and renders it on the frontend', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		await expect
			.poll( () =>
				page.evaluate( () =>
					Boolean(
						window.wp.data
							.select( 'core/block-editor' )
							.getSettings().blockBindingsInnerBlocks
					)
				)
			)
			.toBe( true );

		const { id: patternId } = await createPattern( requestUtils, {
			title: 'Pattern with an editable body',
			anchor: 'pattern-editable-body',
			fallback: FALLBACK_TEXT,
		} );
		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: patternId },
		} );

		const pattern = editor.canvas.getByRole( 'document', {
			name: 'Block: Pattern',
		} );
		const paragraph = pattern.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await expect( paragraph ).toHaveText( FALLBACK_TEXT );

		await paragraph.fill( EDITED_TEXT );
		await expect
			.poll( async () => {
				const [ block ] = await editor.getBlocks();
				return block.attributes.content?.[ AREA_NAME ]?.innerBlocks;
			} )
			.toContain( EDITED_TEXT );

		await paragraph.press( 'Enter' );
		await page.keyboard.type( ADDED_TEXT );
		await expect
			.poll( async () => {
				const [ block ] = await editor.getBlocks();
				return block.attributes.content?.[ AREA_NAME ]?.innerBlocks;
			} )
			.toContain( ADDED_TEXT );

		const resetButton = page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Reset' } );
		await editor.selectBlocks( pattern );
		await editor.showBlockToolbar();
		await expect( resetButton ).toBeEnabled();
		await resetButton.click();
		await expect( paragraph ).toHaveText( FALLBACK_TEXT );
		await expect
			.poll( async () => {
				const [ block ] = await editor.getBlocks();
				return block.attributes.content?.[ AREA_NAME ]?.innerBlocks;
			} )
			.toBeUndefined();

		await paragraph.fill( EDITED_TEXT );
		await expect
			.poll( async () => {
				const [ block ] = await editor.getBlocks();
				return block.attributes.content?.[ AREA_NAME ]?.innerBlocks;
			} )
			.toContain( EDITED_TEXT );

		const postId = await editor.publishPost();
		const patternRecord = await requestUtils.rest( {
			path: `/wp/v2/blocks/${ patternId }`,
			params: { context: 'edit' },
		} );
		expect( patternRecord.content.raw ).toContain( FALLBACK_TEXT );
		expect( patternRecord.content.raw ).not.toContain( EDITED_TEXT );

		await page.goto( `/?p=${ postId }` );
		const frontendArea = page.locator( '#pattern-editable-body' );
		await expect( frontendArea ).toContainText( EDITED_TEXT );
		await expect( frontendArea ).not.toContainText( FALLBACK_TEXT );
	} );

	test( 'uses fallback children for absence and preserves an empty override', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		const { id: absencePatternId } = await createPattern( requestUtils, {
			title: 'Pattern using its fallback',
			anchor: 'absence-area',
			fallback: 'Fallback from absence',
		} );
		const { id: emptyPatternId } = await createPattern( requestUtils, {
			title: 'Pattern with an empty override',
			anchor: 'empty-area',
			fallback: 'Suppressed fallback',
		} );

		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: absencePatternId },
		} );
		await editor.insertBlock( {
			name: 'core/block',
			attributes: {
				ref: emptyPatternId,
				content: {
					[ AREA_NAME ]: { innerBlocks: '' },
				},
			},
		} );

		const patterns = editor.canvas.getByRole( 'document', {
			name: 'Block: Pattern',
		} );
		await expect( patterns.nth( 0 ) ).toContainText(
			'Fallback from absence'
		);
		await expect( patterns.nth( 1 ) ).not.toContainText(
			'Suppressed fallback'
		);

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );
		await expect( page.locator( '#absence-area' ) ).toContainText(
			'Fallback from absence'
		);
		await expect( page.locator( '#empty-area' ) ).not.toContainText(
			'Suppressed fallback'
		);
	} );
} );
