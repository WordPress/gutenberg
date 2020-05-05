/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	clickBlockToolbarButton,
	createNewPost,
	deactivatePlugin,
	getEditedPostContent,
	insertBlock,
	pressKeyTimes,
	setPostContent,
} from '@wordpress/e2e-test-utils';

describe( 'cpt locking', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-plugin-cpt-locking' );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-plugin-cpt-locking' );
	} );

	const shouldRemoveTheInserter = async () => {
		expect(
			await page.$( '.edit-post-header [aria-label="Add block"]' )
		).toBeNull();
	};

	const shouldNotAllowBlocksToBeRemoved = async () => {
		await page.type(
			'.block-editor-rich-text__editable[data-type="core/paragraph"]',
			'p1'
		);
		await clickBlockToolbarButton( 'More options' );
		expect(
			await page.$x( '//button[contains(text(), "Remove Block")]' )
		).toHaveLength( 0 );
	};

	const shouldAllowBlocksToBeMoved = async () => {
		await page.click(
			'.block-editor-rich-text__editable[data-type="core/paragraph"]'
		);
		// Hover the block switcher to show the movers
		await page.hover(
			'.block-editor-block-toolbar .block-editor-block-toolbar__block-switcher-wrapper'
		);
		expect( await page.$( 'button[aria-label="Move up"]' ) ).not.toBeNull();
		await page.click( 'button[aria-label="Move up"]' );
		await page.type(
			'.block-editor-rich-text__editable[data-type="core/paragraph"]',
			'p1'
		);
		expect( await getEditedPostContent() ).toMatchSnapshot();
	};

	describe( 'template_lock all', () => {
		beforeEach( async () => {
			await createNewPost( { postType: 'locked-all-post' } );
		} );

		it( 'should remove the inserter', shouldRemoveTheInserter );

		it(
			'should not allow blocks to be removed',
			shouldNotAllowBlocksToBeRemoved
		);

		it( 'should not allow blocks to be moved', async () => {
			await page.click(
				'.block-editor-rich-text__editable[data-type="core/paragraph"]'
			);
			expect( await page.$( 'button[aria-label="Move up"]' ) ).toBeNull();
		} );

		it( 'should not error when deleting the cotents of a paragraph', async () => {
			await page.click(
				'.block-editor-block-list__block[data-type="core/paragraph"]'
			);
			const textToType = 'Paragraph';
			await page.keyboard.type( 'Paragraph' );
			await pressKeyTimes( 'Backspace', textToType.length + 1 );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'should show invalid template notice if the blocks do not match the templte', async () => {
			const content = await getEditedPostContent();
			const [ , contentWithoutImage ] = content.split(
				'<!-- /wp:image -->'
			);
			await setPostContent( contentWithoutImage );
			const noticeContent = await page.waitForSelector(
				'.editor-template-validation-notice .components-notice__content'
			);
			expect(
				await page.evaluate(
					( _noticeContent ) => _noticeContent.firstChild.nodeValue,
					noticeContent
				)
			).toEqual(
				'The content of your post doesn’t match the template assigned to your post type.'
			);
		} );

		it( 'can use the global inserter in inner blocks', async () => {
			await page.click( 'button[aria-label="Two columns; equal split"]' );
			await page.click(
				'.wp-block-column .block-editor-button-block-appender'
			);
			await page.type( '.block-editor-inserter__search-input', 'image' );
			await page.keyboard.press( 'Tab' );
			await page.keyboard.press( 'Enter' );
			await page.click( '.edit-post-header-toolbar__inserter-toggle' );
			await page.type(
				'.block-editor-inserter__search-input',
				'gallery'
			);
			await page.keyboard.press( 'Tab' );
			await page.keyboard.press( 'Enter' );
			expect( await page.$( '.wp-block-gallery' ) ).not.toBeNull();
		} );
	} );

	describe( 'template_lock insert', () => {
		beforeEach( async () => {
			await createNewPost( { postType: 'locked-insert-post' } );
		} );

		it( 'should remove the inserter', shouldRemoveTheInserter );

		it(
			'should not allow blocks to be removed',
			shouldNotAllowBlocksToBeRemoved
		);

		it( 'should allow blocks to be moved', shouldAllowBlocksToBeMoved );
	} );

	describe( 'template_lock false', () => {
		beforeEach( async () => {
			await createNewPost( { postType: 'not-locked-post' } );
		} );

		it( 'should allow blocks to be inserted', async () => {
			expect(
				await page.$( '.edit-post-header [aria-label="Add block"]' )
			).not.toBeNull();
			await insertBlock( 'List' );
			await page.keyboard.type( 'List content' );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'should allow blocks to be removed', async () => {
			await page.type(
				'.block-editor-rich-text__editable[data-type="core/paragraph"]',
				'p1'
			);
			await clickBlockToolbarButton( 'More options' );
			const [ removeBlock ] = await page.$x(
				'//button[contains(text(), "Remove Block")]'
			);
			await removeBlock.click();
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'should allow blocks to be moved', shouldAllowBlocksToBeMoved );
	} );
} );
