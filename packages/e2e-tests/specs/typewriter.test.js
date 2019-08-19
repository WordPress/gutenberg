/**
 * WordPress dependencies
 */
import { createNewPost } from '@wordpress/e2e-test-utils';

describe( 'TypeWriter', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	const expectScrollPositionToBe = async ( expectedScrollPosition ) => {
		const currentScrollPosition = await page.evaluate( () =>
			wp.dom.computeCaretRect().y
		);
		const diff = Math.abs( currentScrollPosition - expectedScrollPosition );

		// Allow the scroll position to be 1px off.
		expect( diff ).toBeLessThanOrEqual( 1 );
	};

	it( 'should maintain caret position', async () => {
		// Create first block.
		await page.keyboard.press( 'Enter' );

		const initialPosition = await page.evaluate( () =>
			wp.dom.computeCaretRect().y
		);

		// The page shouldn't be scrolled when it's being filled.
		await page.keyboard.press( 'Enter' );

		expect( await page.evaluate( () =>
			wp.dom.computeCaretRect().y
		) ).toBeGreaterThan( initialPosition );

		// Create blocks until the browser scroll the page.
		while ( await page.evaluate( () =>
			wp.dom.getScrollContainer( document.activeElement ).scrollTop === 0
		) ) {
			await page.keyboard.press( 'Enter' );
		}

		// Debounce time for the scroll event listener.
		// eslint-disable-next-line no-restricted-syntax
		await page.waitFor( 100 );

		const newPosition = await page.evaluate( () =>
			wp.dom.computeCaretRect().y
		);

		// Now the scroll position should be maintained.
		await page.keyboard.press( 'Enter' );

		await expectScrollPositionToBe( newPosition );

		// Type until the text wraps.
		while ( await page.evaluate( () =>
			document.activeElement.clientHeight <=
			parseInt( getComputedStyle( document.activeElement ).lineHeight, 10 )
		) ) {
			await page.keyboard.type( 'a' );
		}

		await expectScrollPositionToBe( newPosition );

		// Pressing backspace will reposition the caret to the previous line.
		// Scroll position should be adjusted again.
		await page.keyboard.press( 'Backspace' );

		await expectScrollPositionToBe( newPosition );

		// Should reset scroll position to maintain.
		await page.keyboard.press( 'ArrowUp' );

		const positionAfterArrowUp = await page.evaluate( () =>
			wp.dom.computeCaretRect().y
		);

		expect( positionAfterArrowUp ).toBeLessThan( newPosition );

		// Should be scrolled to new position.
		await page.keyboard.press( 'Enter' );

		await expectScrollPositionToBe( positionAfterArrowUp );
	} );

	it( 'should maintain caret position after scroll', async () => {
		// Create first block.
		await page.keyboard.press( 'Enter' );

		await page.evaluate( () =>
			wp.dom.getScrollContainer( document.activeElement ).scrollTop = 1
		);

		// Debounce time for the scroll event listener.
		// eslint-disable-next-line no-restricted-syntax
		await page.waitFor( 100 );

		const initialPosition = await page.evaluate( () =>
			wp.dom.computeCaretRect().y
		);

		// Should maintain scroll position.
		await page.keyboard.press( 'Enter' );

		await expectScrollPositionToBe( initialPosition );
	} );

	it( 'should maintain caret position after leaving last editable', async () => {
		// Create first block.
		await page.keyboard.press( 'Enter' );
		// Create second block.
		await page.keyboard.press( 'Enter' );
		// Move to first block.
		await page.keyboard.press( 'ArrowUp' );

		const initialPosition = await page.evaluate( () =>
			wp.dom.computeCaretRect().y
		);

		// Should maintain scroll position.
		await page.keyboard.press( 'Enter' );

		await expectScrollPositionToBe( initialPosition );
	} );
} );
