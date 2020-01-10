/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	createNewPost,
	pressKeyWithModifier,
	pressKeyTimes,
	getEditedPostContent,
} from '@wordpress/e2e-test-utils';

async function getSelectedFlatIndices() {
	return await page.evaluate( () => {
		const indices = [];
		let single;

		Array.from(
			document.querySelectorAll( '.wp-block' )
		).forEach( ( node, index ) => {
			if ( node.classList.contains( 'is-selected' ) ) {
				single = index;
			}

			if ( node.classList.contains( 'is-multi-selected' ) ) {
				indices.push( index );
			}
		} );

		return single !== undefined ? single : indices;
	} );
}

/**
 * Tests if the native selection matches the block selection.
 */
async function testNativeSelection() {
	// Wait for the selection to update.
	await page.evaluate( () => new Promise( window.requestAnimationFrame ) );
	await page.evaluate( () => {
		const selection = window.getSelection();
		const elements = Array.from(
			document.querySelectorAll( '.is-multi-selected' )
		);

		if ( ! elements.length ) {
			const element = document.querySelector( '.is-selected' );

			if ( ! element || ! selection.rangeCount ) {
				return;
			}

			const { startContainer, endContainer } = selection.getRangeAt( 0 );

			if ( ! element.contains( startContainer ) ) {
				throw 'expected selection to start in the selected block';
			}

			if ( ! element.contains( endContainer ) ) {
				throw 'expected selection to start in the selected block';
			}

			return;
		}

		if ( ! selection.rangeCount === 1 ) {
			throw 'expected one range';
		}

		if ( selection.isCollapsed ) {
			throw 'expected an uncollapsed selection';
		}

		const firstElement = elements[ 0 ];
		const lastElement = elements[ elements.length - 1 ];
		const { startContainer, endContainer } = selection.getRangeAt( 0 );

		if ( ! firstElement.contains( startContainer ) ) {
			throw 'expected selection to start in the first selected block';
		}

		if ( ! lastElement.contains( endContainer ) ) {
			throw 'expected selection to end in the last selected block';
		}
	} );
}

describe( 'Multi-block selection', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should select with double ctrl+a and speak', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );

		// Multiselect via keyboard.
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 1, 2, 3 ] );

		// TODO: It would be great to do this test by spying on `wp.a11y.speak`,
		// but it's very difficult to do that because `wp.a11y` has
		// DOM-dependant side-effect setup code and doesn't seem straightforward
		// to mock. Instead, we check for the DOM node that `wp.a11y.speak()`
		// inserts text into.
		const speakTextContent = await page.$eval( '#a11y-speak-assertive', ( element ) => element.textContent );
		expect( speakTextContent.trim() ).toEqual( '3 blocks selected.' );
	} );

	// See #14448: an incorrect buffer may trigger multi-selection too soon.
	it( 'should only trigger multi-selection when at the end', async () => {
		// Create a paragraph with four lines.
		await clickBlockAppender();
		await page.keyboard.type( '1.' );
		await pressKeyWithModifier( 'shift', 'Enter' );
		await page.keyboard.type( '2.' );
		await pressKeyWithModifier( 'shift', 'Enter' );
		await page.keyboard.type( '3.' );
		await pressKeyWithModifier( 'shift', 'Enter' );
		await page.keyboard.type( '4.' );
		// Create a second block.
		await page.keyboard.press( 'Enter' );
		// Move to the middle of the first line.
		await pressKeyTimes( 'ArrowUp', 4 );
		await page.keyboard.press( 'ArrowRight' );
		// Select mid line one to mid line four.
		await pressKeyWithModifier( 'shift', 'ArrowDown' );
		await pressKeyWithModifier( 'shift', 'ArrowDown' );
		await pressKeyWithModifier( 'shift', 'ArrowDown' );
		// Delete the text to see if the selection was correct.
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should use selection direction to determine vertical edge', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await pressKeyWithModifier( 'shift', 'Enter' );
		await page.keyboard.type( '2' );

		await pressKeyWithModifier( 'shift', 'ArrowUp' );
		await pressKeyWithModifier( 'shift', 'ArrowDown' );

		// Should type at the end of the paragraph.
		await page.keyboard.type( '.' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should always expand single line selection', async () => {
		await clickBlockAppender();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '12' );
		await page.keyboard.press( 'ArrowLeft' );
		await pressKeyWithModifier( 'shift', 'ArrowRight' );
		await pressKeyWithModifier( 'shift', 'ArrowUp' );
		await testNativeSelection();
		// This delete all blocks.
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should allow selecting outer edge if there is no sibling block', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await pressKeyWithModifier( 'shift', 'ArrowUp' );
		// This should replace the content.
		await page.keyboard.type( '2' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should select and deselect with shift and arrow keys', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '4' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '5' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );
		await pressKeyWithModifier( 'shift', 'ArrowDown' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 3, 4 ] );

		await pressKeyWithModifier( 'shift', 'ArrowDown' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 3, 4, 5 ] );

		await pressKeyWithModifier( 'shift', 'ArrowUp' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 3, 4 ] );

		await pressKeyWithModifier( 'shift', 'ArrowUp' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toBe( 3 );

		await pressKeyWithModifier( 'shift', 'ArrowUp' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 2, 3 ] );

		await pressKeyWithModifier( 'shift', 'ArrowUp' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 1, 2, 3 ] );

		await pressKeyWithModifier( 'shift', 'ArrowDown' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 2, 3 ] );

		await pressKeyWithModifier( 'shift', 'ArrowDown' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toBe( 3 );
	} );

	it( 'should deselect with Escape', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );

		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 1, 2 ] );

		await page.keyboard.press( 'Escape' );

		expect( await getSelectedFlatIndices() ).toEqual( [] );
	} );

	it( 'should select with shift + click', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.down( 'Shift' );
		await page.click( '.wp-block-paragraph' );
		await page.keyboard.up( 'Shift' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 1, 2 ] );
	} );

	it( 'should select by dragging', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowUp' );

		const [ coord1, coord2 ] = await page.evaluate( () => {
			const elements = Array.from( document.querySelectorAll( '.wp-block-paragraph' ) );
			const rect1 = elements[ 0 ].getBoundingClientRect();
			const rect2 = elements[ 1 ].getBoundingClientRect();
			return [
				{
					x: rect1.x + ( rect1.width / 2 ),
					y: rect1.y + ( rect1.height / 2 ),
				},
				{
					x: rect2.x + ( rect2.width / 2 ),
					y: rect2.y + ( rect2.height / 2 ),
				},
			];
		} );

		await page.mouse.move( coord1.x, coord1.y );
		await page.mouse.down();
		await page.mouse.move( coord2.x, coord2.y, { steps: 10 } );
		await page.mouse.up();

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 1, 2 ] );
	} );

	it( 'should select by dragging into nested block', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/cover' );
		await page.keyboard.press( 'Enter' );
		await page.click( '.components-circular-option-picker__option' );
		await page.keyboard.type( '2' );

		const [ coord1, coord2 ] = await page.evaluate( () => {
			const elements = Array.from( document.querySelectorAll( '.wp-block-paragraph' ) );
			const rect1 = elements[ 0 ].getBoundingClientRect();
			const rect2 = elements[ 1 ].getBoundingClientRect();
			return [
				{
					x: rect1.x + ( rect1.width / 2 ),
					y: rect1.y + ( rect1.height / 2 ),
				},
				{
					x: rect2.x + ( rect2.width / 2 ),
					y: rect2.y + ( rect2.height / 2 ),
				},
			];
		} );

		await page.mouse.move( coord1.x, coord1.y );
		await page.mouse.down();
		await page.mouse.move( coord2.x, coord2.y, { steps: 10 } );
		await page.mouse.up();

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 1, 2 ] );
	} );

	it( 'should cut and paste', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'x' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await pressKeyWithModifier( 'primary', 'v' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should copy and paste', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'c' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await pressKeyWithModifier( 'primary', 'v' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
