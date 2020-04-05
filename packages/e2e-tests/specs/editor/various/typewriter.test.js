/**
 * WordPress dependencies
 */
import { createNewPost } from '@wordpress/e2e-test-utils';

describe( 'TypeWriter', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	const getCaretPosition = async () =>
		await page.evaluate( () => wp.dom.computeCaretRect().y );

	// Allow the scroll position to be 1px off.
	const BUFFER = 1;

	const getDiff = async ( caretPosition ) =>
		Math.abs( ( await getCaretPosition() ) - caretPosition );

	it( 'should maintain caret position', async () => {
		// Create first block.
		await page.keyboard.press( 'Enter' );

		const initialPosition = await getCaretPosition();

		// The page shouldn't be scrolled when it's being filled.
		await page.keyboard.press( 'Enter' );

		expect( await getCaretPosition() ).toBeGreaterThan( initialPosition );

		// Create blocks until the the typewriter effect kicks in.
		while (
			await page.evaluate(
				() =>
					wp.dom.getScrollContainer( document.activeElement )
						.scrollTop === 0
			)
		) {
			await page.keyboard.press( 'Enter' );
		}

		const newPosition = await getCaretPosition();

		// Now the scroll position should be maintained.
		await page.keyboard.press( 'Enter' );

		expect( await getDiff( newPosition ) ).toBeLessThanOrEqual( BUFFER );

		// Type until the text wraps.
		while (
			await page.evaluate(
				() =>
					document.activeElement.clientHeight <=
					parseInt(
						getComputedStyle( document.activeElement ).lineHeight,
						10
					)
			)
		) {
			await page.keyboard.type( 'a' );
		}

		expect( await getDiff( newPosition ) ).toBeLessThanOrEqual( BUFFER );

		// Pressing backspace will reposition the caret to the previous line.
		// Scroll position should be adjusted again.
		await page.keyboard.press( 'Backspace' );

		expect( await getDiff( newPosition ) ).toBeLessThanOrEqual( BUFFER );

		// Should reset scroll position to maintain.
		await page.keyboard.press( 'ArrowUp' );

		const positionAfterArrowUp = await getCaretPosition();

		expect( positionAfterArrowUp ).toBeLessThanOrEqual( newPosition );

		// Should be scrolled to new position.
		await page.keyboard.press( 'Enter' );

		expect( await getDiff( positionAfterArrowUp ) ).toBeLessThanOrEqual(
			BUFFER
		);
	} );

	it( 'should maintain caret position after scroll', async () => {
		// Create first block.
		await page.keyboard.press( 'Enter' );

		// Create blocks until there is a scrollable container.
		while (
			await page.evaluate(
				() => ! wp.dom.getScrollContainer( document.activeElement )
			)
		) {
			await page.keyboard.press( 'Enter' );
		}

		await page.evaluate(
			() =>
				( wp.dom.getScrollContainer(
					document.activeElement
				).scrollTop = 1 )
		);

		const initialPosition = await getCaretPosition();

		// Should maintain scroll position.
		await page.keyboard.press( 'Enter' );

		expect( await getDiff( initialPosition ) ).toBeLessThanOrEqual(
			BUFFER
		);
	} );

	it( 'should maintain caret position after leaving last editable', async () => {
		// Create first block.
		await page.keyboard.press( 'Enter' );
		// Create second block.
		await page.keyboard.press( 'Enter' );
		// Move to first block.
		await page.keyboard.press( 'ArrowUp' );

		const initialPosition = await getCaretPosition();

		// Should maintain scroll position.
		await page.keyboard.press( 'Enter' );

		expect( await getDiff( initialPosition ) ).toBeLessThanOrEqual(
			BUFFER
		);
	} );

	it( 'should scroll caret into view from the top', async () => {
		// Create first block.
		await page.keyboard.press( 'Enter' );

		// Create blocks until there is a scrollable container.
		while (
			await page.evaluate(
				() => ! wp.dom.getScrollContainer( document.activeElement )
			)
		) {
			await page.keyboard.press( 'Enter' );
		}

		let count = 0;

		// Create blocks until the the typewriter effect kicks in.
		while (
			await page.evaluate(
				() =>
					wp.dom.getScrollContainer( document.activeElement )
						.scrollTop === 0
			)
		) {
			await page.keyboard.press( 'Enter' );
			count++;
		}

		// Scroll the active element to the very bottom of the scroll container,
		// then scroll 20px down, so the caret is partially hidden.
		await page.evaluate( () => {
			document.activeElement.scrollIntoView( false );
			wp.dom.getScrollContainer( document.activeElement ).scrollTop -= 20;
		} );

		const bottomPostition = await getCaretPosition();

		// Should scroll the caret back into view (preserve browser behaviour).
		await page.keyboard.type( 'a' );

		const newBottomPosition = await getCaretPosition();

		expect( newBottomPosition ).toBeLessThanOrEqual( bottomPostition );

		// Should maintain new caret position.
		await page.keyboard.press( 'Enter' );

		expect( await getDiff( newBottomPosition ) ).toBeLessThanOrEqual(
			BUFFER
		);

		await page.keyboard.press( 'Backspace' );

		while ( count-- ) {
			await page.keyboard.press( 'ArrowUp' );
		}

		// Scroll the active element to the very top of the scroll container,
		// then scroll 10px down, so the caret is partially hidden.
		await page.evaluate( () => {
			document.activeElement.scrollIntoView();
			wp.dom.getScrollContainer( document.activeElement ).scrollTop += 20;
		} );

		const topPostition = await getCaretPosition();

		// Should scroll the caret back into view (preserve browser behaviour).
		await page.keyboard.type( 'a' );

		const newTopPosition = await getCaretPosition();

		expect( newTopPosition ).toBeGreaterThan( topPostition );

		// Should maintain new caret position.
		await page.keyboard.press( 'Enter' );

		expect( await getDiff( newTopPosition ) ).toBeLessThanOrEqual( BUFFER );
	} );
} );
