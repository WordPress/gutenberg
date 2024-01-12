/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/** @typedef {import('@playwright/test').Page} Page */

// Allow the scroll position to be 1px off.
const BUFFER = 1;

test.use( {
	typewriterUtils: async ( { page }, use ) => {
		await use( new TypewriterUtils( { page } ) );
	},
} );

test.describe( 'Typewriter', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should maintain caret position', async ( {
		page,
		typewriterUtils,
	} ) => {
		// Create test blocks.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );

		const initialPosition = await typewriterUtils.getCaretPosition();

		// The page shouldn't be scrolled when it's being filled.
		await page.keyboard.press( 'Enter' );

		expect( await typewriterUtils.getCaretPosition() ).toBeGreaterThan(
			initialPosition
		);

		// Create blocks until the typewriter effect kicks in.
		while (
			await page.evaluate( () => {
				const { activeElement } =
					document.activeElement?.contentDocument ?? document;
				return (
					window.wp.dom.getScrollContainer( activeElement )
						.scrollTop === 0
				);
			} )
		) {
			await page.keyboard.press( 'Enter' );
		}

		const newPosition = await typewriterUtils.getCaretPosition();

		// Now the scroll position should be maintained.
		await page.keyboard.press( 'Enter' );

		expect(
			await typewriterUtils.getDiff( newPosition )
		).toBeLessThanOrEqual( BUFFER );

		// Type until the text wraps.
		while (
			await page.evaluate( () => {
				const { activeElement } =
					document.activeElement?.contentDocument ?? document;
				return (
					activeElement.clientHeight <=
					parseInt(
						window.getComputedStyle( activeElement ).lineHeight,
						10
					)
				);
			} )
		) {
			await page.keyboard.type( 'a' );
		}

		expect(
			await typewriterUtils.getDiff( newPosition )
		).toBeLessThanOrEqual( BUFFER );

		// Pressing backspace will reposition the caret to the previous line.
		// Scroll position should be adjusted again.
		await page.keyboard.press( 'Backspace' );

		expect(
			await typewriterUtils.getDiff( newPosition )
		).toBeLessThanOrEqual( BUFFER );

		// Should reset scroll position to maintain.
		await page.keyboard.press( 'ArrowUp' );

		const positionAfterArrowUp = await typewriterUtils.getCaretPosition();

		expect( positionAfterArrowUp ).toBeLessThanOrEqual( newPosition );

		// Should be scrolled to new position.
		await page.keyboard.press( 'Enter' );

		expect(
			await typewriterUtils.getDiff( positionAfterArrowUp )
		).toBeLessThanOrEqual( BUFFER );
	} );

	test( 'should maintain caret position after scroll', async ( {
		page,
		typewriterUtils,
	} ) => {
		// Create first block.
		await page.keyboard.press( 'Enter' );

		// Create zero or more blocks until there is a scrollable container.
		// No blocks should be created if there's already a scrollbar.
		while (
			await page.evaluate( () => {
				const { activeElement } =
					document.activeElement?.contentDocument ?? document;
				const scrollContainer =
					window.wp.dom.getScrollContainer( activeElement );
				return (
					scrollContainer.scrollHeight ===
					scrollContainer.clientHeight
				);
			} )
		) {
			await page.keyboard.press( 'Enter' );
		}

		const scrollPosition = await page.evaluate( () => {
			const { activeElement } =
				document.activeElement?.contentDocument ?? document;
			return window.wp.dom.getScrollContainer( activeElement ).scrollTop;
		} );

		// Expect scrollbar to be at the top.
		expect( scrollPosition ).toBe( 0 );

		// Move the mouse to the scroll container, and scroll down
		// a small amount to trigger the typewriter mode.
		await page.evaluate( () => {
			const { activeElement } =
				document.activeElement?.contentDocument ?? document;
			window.wp.dom.getScrollContainer( activeElement ).scrollTop += 2;
		} );
		// Wait for the caret rectangle to be recalculated.
		await page.evaluate(
			() => new Promise( window.requestAnimationFrame )
		);

		// After hitting Enter to create a new block, the caret screen
		// coordinates should be the same.
		const initialPosition = await typewriterUtils.getCaretPosition();
		await page.keyboard.press( 'Enter' );
		await page.waitForFunction( () => {
			const { activeElement } =
				document.activeElement?.contentDocument ?? document;
			// Wait for the Typewriter to scroll down past the initial position.
			return (
				window.wp.dom.getScrollContainer( activeElement ).scrollTop > 2
			);
		} );

		expect( await typewriterUtils.getDiff( initialPosition ) ).toBe( 0 );
	} );

	test( 'should maintain caret position after leaving last editable', async ( {
		page,
		typewriterUtils,
	} ) => {
		// Create test blocks.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		// Move to first block.
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );

		const initialPosition = await typewriterUtils.getCaretPosition();

		// Should maintain scroll position.
		expect(
			await typewriterUtils.getDiff( initialPosition )
		).toBeLessThanOrEqual( BUFFER );
	} );

	test( 'should scroll caret into view from the top', async ( {
		page,
		typewriterUtils,
	} ) => {
		// Create first block.
		await page.keyboard.press( 'Enter' );

		// Create blocks until there is a scrollable container.
		while (
			await page.evaluate( () => {
				const { activeElement } =
					document.activeElement?.contentDocument ?? document;
				return ! window.wp.dom.getScrollContainer( activeElement );
			} )
		) {
			await page.keyboard.press( 'Enter' );
		}

		let count = 0;

		// Create blocks until the typewriter effect kicks in, create at
		// least 10 blocks to properly test it.
		while (
			( await page.evaluate( () => {
				const { activeElement } =
					document.activeElement?.contentDocument ?? document;
				return (
					window.wp.dom.getScrollContainer( activeElement )
						.scrollTop === 0
				);
			} ) ) ||
			count < 10
		) {
			await page.keyboard.press( 'Enter' );
			count++;
		}

		// Scroll the active element to the very bottom of the scroll container,
		// then scroll up, so the caret is partially hidden.
		await page.evaluate( () => {
			const { activeElement } =
				document.activeElement?.contentDocument ?? document;
			activeElement.scrollIntoView( false );
			window.wp.dom.getScrollContainer( activeElement ).scrollTop -=
				activeElement.offsetHeight + 10;
		} );

		const bottomPostition = await typewriterUtils.getCaretPosition();

		// Should scroll the caret back into view (preserve browser behaviour).
		await page.keyboard.type( 'a' );

		const newBottomPosition = await typewriterUtils.getCaretPosition();

		expect( newBottomPosition ).toBeLessThanOrEqual( bottomPostition );

		// Should maintain new caret position.
		await page.keyboard.press( 'Enter' );

		expect(
			await typewriterUtils.getDiff( newBottomPosition )
		).toBeLessThanOrEqual( BUFFER );

		await page.keyboard.press( 'Backspace' );

		while ( count-- ) {
			await page.keyboard.press( 'ArrowUp' );
		}

		// Scroll the active element to the very top of the scroll container,
		// then scroll down, so the caret is partially hidden.
		await page.evaluate( () => {
			const { activeElement } =
				document.activeElement?.contentDocument ?? document;
			activeElement.scrollIntoView();
			window.wp.dom.getScrollContainer( activeElement ).scrollTop +=
				activeElement.offsetHeight + 10;
		} );

		const topPostition = await typewriterUtils.getCaretPosition();

		// Should scroll the caret back into view (preserve browser behaviour).
		await page.keyboard.type( 'a' );

		const newTopPosition = await typewriterUtils.getCaretPosition();

		expect( newTopPosition ).toBeGreaterThan( topPostition );

		// Should maintain new caret position.
		await page.keyboard.press( 'Enter' );

		expect(
			await typewriterUtils.getDiff( newTopPosition )
		).toBeLessThanOrEqual( BUFFER );
	} );
} );

class TypewriterUtils {
	/** @type {Page} */
	#page;

	constructor( { page } ) {
		this.#page = page;
	}

	async getCaretPosition() {
		return await this.#page.evaluate( () => {
			return window.wp.dom.computeCaretRect(
				document.activeElement?.contentWindow ?? window
			).y;
		} );
	}

	async getDiff( caretPosition ) {
		return Math.abs( ( await this.getCaretPosition() ) - caretPosition );
	}
}
