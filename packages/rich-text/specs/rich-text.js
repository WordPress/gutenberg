describe( 'RichText', () => {
	const getValue = async () => {
		return await page.evaluate( () => window._value );
	};

	beforeEach( async () => {
		await page.goto( 'http://localhost:1234' );
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
} );
