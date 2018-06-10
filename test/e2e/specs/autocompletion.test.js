/**
 * Internal dependencies
 */
import '../support/bootstrap';
import { newPost, newDesktopBrowserPage } from '../support/utils';

describe( 'autocompletion', () => {
	beforeAll( async () => {
		await newDesktopBrowserPage();
		await newPost();
	} );

	it( 'adds a token followed by a zero-width non-breaking space and the cursor', async () => {
		await page.click( '.editor-default-block-appender' );

		const contentEditableHandle = (
			await page.evaluateHandle( () => document.activeElement )
		);

		await contentEditableHandle.asElement().type( '@' );
		const optionNode = await page.waitForSelector( '.components-autocomplete__result', { timeout: 10000 } );
		optionNode.click();

		// Wait for content update.
		await page.waitForFunction(
			( contentEditableNode ) => contentEditableNode.textContent.length > 0,
			{ timeout: 1000 },
			contentEditableHandle
		);

		// Confirm we contain the selection.
		expect( await page.evaluate(
			( contentEditableNode ) => {
				const { anchorNode, isCollapsed } = window.getSelection();
				return contentEditableNode.contains( anchorNode ) && isCollapsed;
			},
			contentEditableHandle
		) ).toBeTruthy();

		// Confirm the expected content.
		expect( await page.evaluate(
			( contentEditableNode ) => contentEditableNode.textContent,
			contentEditableHandle
		) ).toMatch( /^@\w+\uFEFF$/ );

		// Selection is placed after a single zero-width space text node.
		const selectionAnchorHandle = await page.evaluateHandle( () => window.getSelection().anchorNode );
		expect( await page.evaluate(
			( contentEditableNode, anchorNode ) => contentEditableNode === anchorNode,
			contentEditableHandle,
			selectionAnchorHandle
		) ).toBeTruthy();
		const zeroWidthNonbreakingSpace = '\uFEFF';
		const selectionAnchorOffset = await page.evaluate( () => window.getSelection().anchorOffset );
		expect( await page.evaluate(
			( anchorNode, anchorOffset ) => {
				const lastChildNodeIndex = anchorNode.childNodes.length - 1;
				return anchorOffset === lastChildNodeIndex;
			},
			selectionAnchorHandle,
			selectionAnchorOffset
		) ).toBeTruthy();
		const spaceNodeHandle = await page.evaluateHandle(
			( anchorNode, anchorOffset ) => anchorNode.childNodes[ anchorOffset ].previousSibling,
			selectionAnchorHandle,
			selectionAnchorOffset
		);
		expect( await page.evaluate(
			( spaceNode ) => spaceNode.textContent,
			spaceNodeHandle
		) ).toBe( zeroWidthNonbreakingSpace );

		// The autocomplete token precedes the space.
		const tokenHandle = await page.evaluateHandle(
			( spaceNode ) => spaceNode.previousSibling,
			spaceNodeHandle
		);
		expect( await page.evaluate(
			( tokenNode ) => tokenNode.nodeType === window.Node.ELEMENT_NODE,
			tokenHandle
		) ).toBeTruthy();
		expect( await page.evaluate(
			( tokenNode ) => tokenNode.classList.contains( 'autocomplete-token' ),
			tokenHandle
		) ).toBeTruthy();
		expect( await page.evaluate(
			( tokenNode ) => /^@\w+$/.test( tokenNode.textContent ),
			tokenHandle
		) ).toBeTruthy();
	} );
} );
