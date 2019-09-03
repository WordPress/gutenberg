describe( 'RichText', () => {
	const isMac = process.platform === 'darwin';
	const getValue = async () => {
		return await page.evaluate( () => window.test.value );
	};

	beforeEach( async () => {
		await page.goto( 'http://localhost:1234' );
		await page.evaluate( async () => {
			const { render, createElement, RichText } = window.test;
			const onChange = ( newValue ) => window.test.value = newValue;
			const element = createElement( RichText, { onChange } );
			const container = document.querySelector( 'div' );

			return new Promise( ( resolve ) => {
				render( element, container, resolve );
			} );
		} );
		await page.keyboard.press( 'Tab' );
	} );

	it( 'should load without triggering a change', async () => {
		expect( await getValue() ).toBe( undefined );
	} );

	it( 'should allow input', async () => {
		await page.keyboard.type( '1' );

		expect( await getValue() ).toBe( '1' );

		await page.keyboard.press( 'Backspace' );

		expect( await getValue() ).toBe( '' );
	} );

	it( 'should not react to the `Enter` key', async () => {
		await page.keyboard.press( 'Enter' );

		expect( await getValue() ).toBe( undefined );
	} );

	it( 'should navigate horizontally', async () => {
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( '3' );

		expect( await getValue() ).toBe( '123' );
	} );

	it( 'should navigate horizontally with `Alt` key', async () => {
		await page.keyboard.type( '23' );
		await page.keyboard.down( 'Alt' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.up( 'Alt' );
		await page.keyboard.type( '1' );
		await page.keyboard.down( 'Alt' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.up( 'Alt' );
		await page.keyboard.type( '4' );

		expect( await getValue() ).toBe( '1234' );
	} );

	it( 'should navigate vertically', async () => {
		await page.evaluate( () => {
			document.activeElement.style.width = '1px';
		} );
		await page.keyboard.type( '13' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.type( '4' );

		expect( await getValue() ).toBe( '1234' );
	} );

	it( 'should select with `Shift` key', async () => {
		await page.keyboard.type( '2' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.up( 'Shift' );
		await page.keyboard.type( '1' );

		expect( await getValue() ).toBe( '1' );
	} );

	it( 'should select with `Shift` and `Alt` key', async () => {
		await page.keyboard.type( '23' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.down( 'Alt' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.up( 'Alt' );
		await page.keyboard.up( 'Shift' );
		await page.keyboard.type( '1' );

		expect( await getValue() ).toBe( '1' );
	} );

	it( 'should handle `Home` and `End` keys', async () => {
		await page.keyboard.type( '23' );
		await page.keyboard.press( 'Home' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'End' );
		await page.keyboard.type( '4' );

		expect( await getValue() ).toBe( '1234' );
	} );

	it( 'should not format with native shortcut', async () => {
		await page.keyboard.type( '1' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.up( 'Shift' );
		await page.keyboard.down( isMac ? 'Meta' : 'Control' );
		await page.keyboard.press( 'b' );
		await page.keyboard.up( isMac ? 'Meta' : 'Control' );

		expect( await getValue() ).toBe( '1' );
	} );

	it( 'should not delete surrounding space when deleting a word with Backspace', async () => {
		await page.keyboard.type( '1 2 3' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Backspace' );

		expect( await getValue() ).toBe( '1  3' );

		await page.keyboard.type( '2' );

		expect( await getValue() ).toBe( '1 2 3' );
	} );

	it( 'should not delete surrounding space when deleting a word with Alt+Backspace', async () => {
		await page.keyboard.type( 'alpha beta gamma' );

		for ( let index = 0; index < ' gamma'.length; index++ ) {
			await page.keyboard.press( 'ArrowLeft' );
		}

		await page.keyboard.down( isMac ? 'Alt' : 'Control' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.up( isMac ? 'Alt' : 'Control' );

		expect( await getValue() ).toBe( 'alpha  gamma' );

		await page.keyboard.type( 'beta' );

		expect( await getValue() ).toBe( 'alpha beta gamma' );
	} );

	it( 'should not delete surrounding space when deleting a selected word', async () => {
		await page.keyboard.type( 'alpha beta gamma' );

		for ( let index = 0; index < ' gamma'.length; index++ ) {
			await page.keyboard.press( 'ArrowLeft' );
		}

		await page.keyboard.down( 'Shift' );

		for ( let index = 0; index < 'beta'.length; index++ ) {
			await page.keyboard.press( 'ArrowLeft' );
		}

		await page.keyboard.up( 'Shift' );
		await page.keyboard.press( 'Backspace' );

		expect( await getValue() ).toBe( 'alpha  gamma' );

		await page.keyboard.type( 'beta' );

		expect( await getValue() ).toBe( 'alpha beta gamma' );
	} );

	it( 'should arrow navigate (rtl)', async () => {
		// Avoid using three, as it looks too much like two with some fonts.
		const ARABIC_ZERO = '٠';
		const ARABIC_ONE = '١';
		const ARABIC_TWO = '٢';

		await page.evaluate( () => document.dir = 'rtl' );
		// We need at least three characters as arrow navigation *from* the
		// edges might be handled differently.
		await page.keyboard.type( ARABIC_ONE );
		await page.keyboard.type( ARABIC_TWO );
		await page.keyboard.press( 'ArrowRight' );
		// This is the important key press: arrow nav *from* the middle.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( ARABIC_ZERO );

		// N.b.: HTML is LTR, so direction will be reversed!
		expect( await getValue() ).toBe( ARABIC_ZERO + ARABIC_ONE + ARABIC_TWO );
	} );
} );
