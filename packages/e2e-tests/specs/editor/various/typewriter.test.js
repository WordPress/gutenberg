/**
 * WordPress dependencies
 */
import { createNewPost } from '@wordpress/e2e-test-utils';

describe( 'TypeWriter', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	const getCaretPosition = async () =>
		await page.evaluate( () => wp.dom.computeCaretRect( window ).y );

	// Allow the scroll position to be 1px off.
	const BUFFER = 1;

	const getDiff = async ( caretPosition ) =>
		Math.abs( ( await getCaretPosition() ) - caretPosition );

	it( 'should maintain caret position', async () => {
		// Create first block.
		await page.keyboard.press( 'Enter' );

		// Create second block.
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

		// Create zero or more blocks until there is a scrollable container.
		// No blocks should be created if there's already a scrollbar.
		while (
			await page.evaluate(
				() => ! wp.dom.getScrollContainer( document.activeElement )
			)
		) {
			await page.keyboard.press( 'Enter' );
		}

		const scrollPosition = await page.evaluate(
			() => wp.dom.getScrollContainer( document.activeElement ).scrollTop
		);
		// Expect scrollbar to be at the top.
		expect( scrollPosition ).toBe( 0 );

		// Move the mouse to the scroll container, and scroll down
		// a small amount to trigger the typewriter mode.
		const mouseMovePosition = await page.evaluate( () => {
			const caretRect = wp.dom.computeCaretRect( window );
			return [ Math.floor( caretRect.x ), Math.floor( caretRect.y ) ];
		} );
		await page.mouse.move( ...mouseMovePosition );
		await page.mouse.wheel( { deltaY: 2 } );
		await page.waitForFunction(
			() =>
				wp.dom.getScrollContainer( document.activeElement )
					.scrollTop === 2
		);
		// Wait for the caret rectangle to be recalculated.
		await page.evaluate(
			() => new Promise( window.requestAnimationFrame )
		);

		// After hitting Enter to create a new block, the caret screen
		// coordinates should be the same.
		const initialPosition = await getCaretPosition();
		await page.keyboard.press( 'Enter' );
		await page.waitForFunction(
			() =>
				// Wait for the Typewriter to scroll down past the initial position.
				wp.dom.getScrollContainer( document.activeElement ).scrollTop >
				2
		);
		expect( await getDiff( initialPosition ) ).toBe( 0 );
	} );

	it( 'should maintain caret position after leaving last editable', async () => {
		// Create first block.
		await page.keyboard.press( 'Enter' );
		// Create second block.
		await page.keyboard.press( 'Enter' );
		// Create third block.
		await page.keyboard.press( 'Enter' );
		// Move to first block.
		await page.keyboard.press( 'ArrowUp' );
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

		// Create blocks until the the typewriter effect kicks in, create at
		// least 10 blocks to properly test the .
		while (
			( await page.evaluate(
				() =>
					wp.dom.getScrollContainer( document.activeElement )
						.scrollTop === 0
			) ) ||
			count < 10
		) {
			await page.keyboard.press( 'Enter' );
			count++;
		}

		// Scroll the active element to the very bottom of the scroll container,
		// then scroll up, so the caret is partially hidden.
		await page.evaluate( () => {
			document.activeElement.scrollIntoView( false );
			wp.dom.getScrollContainer( document.activeElement ).scrollTop -=
				document.activeElement.offsetHeight + 10;
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
		// then scroll down, so the caret is partially hidden.
		await page.evaluate( () => {
			document.activeElement.scrollIntoView();
			wp.dom.getScrollContainer( document.activeElement ).scrollTop +=
				document.activeElement.offsetHeight + 10;
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
