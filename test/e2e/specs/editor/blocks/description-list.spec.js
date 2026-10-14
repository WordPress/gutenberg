const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const DESCRIPTION_TERM = 'core/description-term';
const DESCRIPTION_DETAIL = 'core/description-detail';

const term = ( content = '' ) => ( {
	name: 'core/description-term',
	content,
} );

const detail = ( content = '' ) => ( {
	name: 'core/description-detail',
	content,
} );

async function expectDescriptionListChildren( editor, children ) {
	await expect
		.poll( async () => {
			const [ descriptionList ] = await editor.getBlocks();

			return descriptionList.innerBlocks.map(
				( { name, attributes } ) => ( {
					name,
					content: attributes.content || '',
				} )
			);
		} )
		.toEqual( children );
}

async function clickBlockSwitcherMenuItem( { editor, page, from, to } ) {
	await editor.showBlockToolbar();
	await page
		.getByRole( 'toolbar', { name: 'Block tools' } )
		.getByRole( 'button', { name: from } )
		.click();
	await page
		.getByRole( 'menu', { name: from } )
		.getByRole( 'menuitem', { name: to } )
		.click();
}

async function focusRichTextAtOffset( { editor, tagName, text, offset } ) {
	const richText = editor.canvas
		.locator( tagName )
		.filter( { hasText: text } )
		.first();

	await richText.click();
	await richText.evaluate( ( element, caretOffset ) => {
		const ownerDocument = element.ownerDocument;
		const selection = ownerDocument.getSelection();
		const walker = ownerDocument.createTreeWalker(
			element,
			NodeFilter.SHOW_TEXT
		);
		const range = ownerDocument.createRange();
		let textNode = walker.nextNode();
		let remainingOffset = caretOffset;

		while ( textNode && remainingOffset > textNode.textContent.length ) {
			remainingOffset -= textNode.textContent.length;
			textNode = walker.nextNode();
		}

		if ( textNode ) {
			range.setStart( textNode, remainingOffset );
		} else {
			range.setStart( element, element.childNodes.length );
		}

		range.collapse( true );
		selection.removeAllRanges();
		selection.addRange( range );
		element.focus();
	}, offset );
}

async function focusRichTextAtEnd( { editor, tagName, text } ) {
	await focusRichTextAtOffset( {
		editor,
		tagName,
		text,
		offset: text.length,
	} );
}

async function expectSelectedDescriptionListChild( {
	page,
	blockName,
	index,
	offset = 0,
} ) {
	await expect
		.poll( async () =>
			page.evaluate( () => {
				const editorSelect =
					window.wp.data.select( 'core/block-editor' );
				const selectionStart = editorSelect.getSelectionStart();
				const selectedBlock = editorSelect.getBlock(
					selectionStart?.clientId
				);

				return {
					name: selectedBlock?.name,
					index: editorSelect.getBlockIndex(
						selectionStart?.clientId
					),
					attributeKey: selectionStart?.attributeKey,
					offset: selectionStart?.offset,
				};
			} )
		)
		.toEqual( {
			name: blockName,
			index,
			attributeKey: 'content',
			offset,
		} );
}

test.describe( 'Description List', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'inserts one term followed by one detail', async ( { editor } ) => {
		await editor.insertBlock( { name: 'core/description-list' } );

		await expectDescriptionListChildren( editor, [ term(), detail() ] );
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'Enter at the end of the initial term focuses the existing detail', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/description-list' } );

		await editor.canvas.locator( 'dt' ).fill( 'API' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Application programming interface' );

		await expectDescriptionListChildren( editor, [
			term( 'API' ),
			detail( 'Application programming interface' ),
		] );
		await expectSelectedDescriptionListChild( {
			page,
			blockName: DESCRIPTION_DETAIL,
			index: 1,
			offset: 'Application programming interface'.length,
		} );
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'Enter at the end of the final detail appends one term and detail', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: DESCRIPTION_TERM,
					attributes: { content: 'Cyclone' },
				},
				{
					name: DESCRIPTION_DETAIL,
					attributes: { content: 'Rotating weather system' },
				},
			],
		} );

		await focusRichTextAtEnd( {
			editor,
			tagName: 'dd',
			text: 'Rotating weather system',
		} );
		await page.keyboard.press( 'Enter' );

		await expectDescriptionListChildren( editor, [
			term( 'Cyclone' ),
			detail( 'Rotating weather system' ),
			term(),
			detail(),
		] );
		await expectSelectedDescriptionListChild( {
			page,
			blockName: DESCRIPTION_TERM,
			index: 2,
			offset: 0,
		} );
		await page.keyboard.type( 'SDK' );
		await expectDescriptionListChildren( editor, [
			term( 'Cyclone' ),
			detail( 'Rotating weather system' ),
			term( 'SDK' ),
			detail(),
		] );
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'one Undo removes a newly appended term and detail together', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: DESCRIPTION_TERM,
					attributes: { content: 'Cyclone' },
				},
				{
					name: DESCRIPTION_DETAIL,
					attributes: { content: 'Rotating weather system' },
				},
			],
		} );

		await focusRichTextAtEnd( {
			editor,
			tagName: 'dd',
			text: 'Rotating weather system',
		} );
		await page.keyboard.press( 'Enter' );
		await expectDescriptionListChildren( editor, [
			term( 'Cyclone' ),
			detail( 'Rotating weather system' ),
			term(),
			detail(),
		] );

		await page.getByRole( 'button', { name: 'Undo' } ).click();
		await expectDescriptionListChildren( editor, [
			term( 'Cyclone' ),
			detail( 'Rotating weather system' ),
		] );
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'Enter at the end of a trailing term appends one detail', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: DESCRIPTION_TERM,
					attributes: { content: 'Storm' },
				},
				{
					name: DESCRIPTION_DETAIL,
					attributes: { content: 'Weather' },
				},
				{
					name: DESCRIPTION_TERM,
					attributes: { content: 'Cyclone' },
				},
			],
		} );

		await focusRichTextAtEnd( {
			editor,
			tagName: 'dt',
			text: 'Cyclone',
		} );
		await page.keyboard.press( 'Enter' );

		await expectDescriptionListChildren( editor, [
			term( 'Storm' ),
			detail( 'Weather' ),
			term( 'Cyclone' ),
			detail(),
		] );
		await expectSelectedDescriptionListChild( {
			page,
			blockName: DESCRIPTION_DETAIL,
			index: 3,
		} );
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'Enter at the end of a child with a following sibling moves to that sibling', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: DESCRIPTION_TERM,
					attributes: { content: 'API' },
				},
				{
					name: DESCRIPTION_DETAIL,
					attributes: {
						content: 'Application programming interface',
					},
				},
				{
					name: DESCRIPTION_TERM,
					attributes: { content: 'SDK' },
				},
				{
					name: DESCRIPTION_DETAIL,
					attributes: { content: 'Software development kit' },
				},
			],
		} );

		await focusRichTextAtEnd( {
			editor,
			tagName: 'dd',
			text: 'Application programming interface',
		} );
		await page.keyboard.press( 'Enter' );

		await expectDescriptionListChildren( editor, [
			term( 'API' ),
			detail( 'Application programming interface' ),
			term( 'SDK' ),
			detail( 'Software development kit' ),
		] );
		await expectSelectedDescriptionListChild( {
			page,
			blockName: DESCRIPTION_TERM,
			index: 2,
		} );
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'restricted insertion does not append a partial term and detail pair', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: DESCRIPTION_TERM,
					attributes: { content: 'Cyclone' },
				},
				{
					name: DESCRIPTION_DETAIL,
					attributes: { content: 'Rotating weather system' },
				},
			],
		} );

		await focusRichTextAtEnd( {
			editor,
			tagName: 'dd',
			text: 'Rotating weather system',
		} );
		await page.evaluate( () => {
			const blockEditor = window.wp.data.select( 'core/block-editor' );
			const [ descriptionListClientId ] = blockEditor.getBlockOrder();
			window.wp.data
				.dispatch( 'core/block-editor' )
				.updateBlockListSettings( descriptionListClientId, {
					templateLock: 'insert',
				} );
		} );
		await page.keyboard.press( 'Enter' );

		await expectDescriptionListChildren( editor, [
			term( 'Cyclone' ),
			detail( 'Rotating weather system' ),
		] );
		await expectSelectedDescriptionListChild( {
			page,
			blockName: DESCRIPTION_DETAIL,
			index: 1,
			offset: 'Rotating weather system'.length,
		} );
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'Enter in the middle of a term splits into consecutive terms', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: DESCRIPTION_TERM,
					attributes: { content: 'Cyclone' },
				},
				{
					name: DESCRIPTION_DETAIL,
					attributes: { content: 'Rotating weather system' },
				},
			],
		} );

		await focusRichTextAtOffset( {
			editor,
			tagName: 'dt',
			text: 'Cyclone',
			offset: 2,
		} );
		await page.keyboard.press( 'Enter' );

		await expectDescriptionListChildren( editor, [
			term( 'Cy' ),
			term( 'clone' ),
			detail( 'Rotating weather system' ),
		] );
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'Enter in the middle of a detail splits into consecutive details', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: DESCRIPTION_TERM,
					attributes: { content: 'API' },
				},
				{
					name: DESCRIPTION_DETAIL,
					attributes: { content: 'FirstSecond' },
				},
			],
		} );

		await focusRichTextAtOffset( {
			editor,
			tagName: 'dd',
			text: 'FirstSecond',
			offset: 5,
		} );
		await page.keyboard.press( 'Enter' );

		await expectDescriptionListChildren( editor, [
			term( 'API' ),
			detail( 'First' ),
			detail( 'Second' ),
		] );
	} );

	test( 'Tab and Shift+Tab use normal editor focus navigation', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: DESCRIPTION_TERM,
					attributes: { content: 'Cyclone' },
				},
				{
					name: DESCRIPTION_DETAIL,
					attributes: { content: 'Rotating weather system' },
				},
			],
		} );

		await editor.canvas.getByText( 'Cyclone', { exact: true } ).click();
		await page.keyboard.press( 'Tab' );
		await expect(
			page.getByRole( 'tab', { name: 'Block' } )
		).toBeFocused();
		await expectDescriptionListChildren( editor, [
			term( 'Cyclone' ),
			detail( 'Rotating weather system' ),
		] );

		await page.keyboard.press( 'Shift+Tab' );
		await expect(
			editor.canvas.getByText( 'Cyclone', { exact: true } )
		).toBeFocused();
		await expectDescriptionListChildren( editor, [
			term( 'Cyclone' ),
			detail( 'Rotating weather system' ),
		] );
	} );

	test( 'Escape moves focus to the editor canvas after editing a child', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: DESCRIPTION_TERM,
					attributes: { content: 'Nimbus' },
				},
				{
					name: DESCRIPTION_DETAIL,
					attributes: { content: 'Rain-bearing cloud' },
				},
			],
		} );

		await editor.canvas.getByText( 'Nimbus', { exact: true } ).click();
		await page.keyboard.press( 'Escape' );

		await expect(
			page.getByRole( 'button', { name: 'Editor canvas' } )
		).toBeFocused();
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'toolbar transforms preserve child content', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: DESCRIPTION_TERM,
					attributes: { content: 'API' },
				},
				{
					name: DESCRIPTION_DETAIL,
					attributes: {
						content: 'Application programming interface',
					},
				},
			],
		} );

		await editor.canvas.getByText( 'API' ).click();
		await clickBlockSwitcherMenuItem( {
			editor,
			page,
			from: 'Description Term',
			to: 'Description Detail',
		} );
		await expectDescriptionListChildren( editor, [
			detail( 'API' ),
			detail( 'Application programming interface' ),
		] );

		await editor.canvas
			.getByText( 'Application programming interface' )
			.click();
		await clickBlockSwitcherMenuItem( {
			editor,
			page,
			from: 'Description Detail',
			to: 'Description Term',
		} );
		await expectDescriptionListChildren( editor, [
			detail( 'API' ),
			term( 'Application programming interface' ),
		] );
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'retains child structure and content after save and reload', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: DESCRIPTION_TERM,
					attributes: { content: 'Monsoon' },
				},
				{
					name: DESCRIPTION_DETAIL,
					attributes: { content: 'Seasonal wind pattern' },
				},
				{
					name: DESCRIPTION_TERM,
					attributes: { content: 'Sirocco' },
				},
				{
					name: DESCRIPTION_DETAIL,
					attributes: { content: 'Warm Mediterranean wind' },
				},
			],
		} );

		await editor.saveDraft();
		await page.reload();

		await expectDescriptionListChildren( editor, [
			term( 'Monsoon' ),
			detail( 'Seasonal wind pattern' ),
			term( 'Sirocco' ),
			detail( 'Warm Mediterranean wind' ),
		] );
	} );
} );
