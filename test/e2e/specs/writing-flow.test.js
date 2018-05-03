/**
 * External dependencies
 */
import { times } from 'lodash';

/**
 * Internal dependencies
 */
import '../support/bootstrap';
import { newPost, newDesktopBrowserPage, pressWithModifier } from '../support/utils';

describe( 'adding blocks', () => {
	beforeAll( async () => {
		await newDesktopBrowserPage();
		await newPost();
	} );

	/**
	 * Given an array of functions, each returning a promise, performs all
	 * promises in sequence (waterfall) order.
	 *
	 * @param {Function[]} sequence Array of promise creators.
	 *
	 * @return {Promise} Promise resolving once all in the sequence complete.
	 */
	async function promiseSequence( sequence ) {
		return sequence.reduce(
			( current, next ) => current.then( next ),
			Promise.resolve()
		);
	}

	/**
	 * Asserts that the nth paragraph matches expected snapshot content.
	 *
	 * @param {number} nthChild 1-based index of paragraph to assert against.
	 */
	async function expectParagraphToMatchSnapshot( nthChild ) {
		const content = await page.$eval(
			`.editor-block-list__block:nth-child( ${ nthChild } ) .wp-block-paragraph`,
			( element ) => element.innerHTML
		);

		expect( content ).toMatchSnapshot();
	}

	it( 'Should navigate with arrow keys', async () => {
		// Add demo content
		await page.click( '.editor-default-block-appender__content' );
		await page.keyboard.type( 'Hello World' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Hello World' );

		// Traverse back to first paragraph. With identical content, assume
		// caret will be at end of content. Append.
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( '!' );
		await expectParagraphToMatchSnapshot( 1 );

		// Likewise, pressing arrow down when subsequent paragraph is shorter
		// should move caret to end of the paragraph. Remove second word.
		await page.keyboard.press( 'ArrowDown' );
		await promiseSequence( times( 6, () => () => page.keyboard.press( 'Backspace' ) ) );
		await expectParagraphToMatchSnapshot( 2 );

		// Arrow up should preserve caret X position. Add content to middle.
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( ' to the' );
		await expectParagraphToMatchSnapshot( 1 );

		// Arrow up from uncollapsed selection behaves same as collapsed.
		// Highlight first word of second paragraph and prepend to first.
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.down( 'Shift' );
		await promiseSequence( times( 5, () => () => page.keyboard.press( 'ArrowLeft' ) ) );
		await page.keyboard.up( 'Shift' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( 'Greeting: ' );
		await expectParagraphToMatchSnapshot( 1 );

		// Arrow up from second line of paragraph should _not_ place caret out
		// of the current block.
		await pressWithModifier( 'Shift', 'Enter' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( 'The ' );
		await expectParagraphToMatchSnapshot( 1 );

		// Pressing down from last paragraph should move caret to end of the
		// text of the last paragraph
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowDown' );

		// Regression test: Ensure selection can be progressively collapsed at
		// beginning and end of text while shift is held.
		await promiseSequence( times( 5, () => () => page.keyboard.press( 'ArrowLeft' ) ) );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.up( 'Shift' );
		await page.keyboard.type( 'Prefix: ' );
		await expectParagraphToMatchSnapshot( 2 );

		// Likewise, ensure progressive collapse from previous block (previous
		// to guard against multi-selection behavior). Asserts arrow left to
		// traverse horizontally to previous.
		await promiseSequence( times( 9, () => () => page.keyboard.press( 'ArrowLeft' ) ) );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.up( 'Shift' );
		await page.keyboard.type( ' (Suffix)' );
		await expectParagraphToMatchSnapshot( 1 );
	} );
} );
