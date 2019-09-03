describe( 'RichText', () => {
	const getValue = async () => {
		return await page.evaluate( () => window.test.value );
	};

	beforeEach( async () => {
		await page.goto( 'http://localhost:1234' );
		await page.evaluate( async () => {
			const { render, createElement, RichText, insert } = window.test;
			const element = createElement( RichText, {
				onChange: ( newValue ) => window.test.value = newValue,
				onEnter: ( { value, onChange } ) => onChange( insert( value, '\n' ) ),
			} );
			const container = document.querySelector( 'div' );

			return new Promise( ( resolve ) => {
				render( element, container, resolve );
			} );
		} );
		await page.keyboard.press( 'Tab' );
	} );

	it( 'should insert line break at end', async () => {
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		expect( await getValue() ).toBe( 'a<br>' );
	} );

	it( 'should insert line break at end and continue writing', async () => {
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'b' );
		expect( await getValue() ).toBe( 'a<br>b' );
	} );

	it( 'should insert line break mid text', async () => {
		await page.keyboard.type( 'ab' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Enter' );
		expect( await getValue() ).toBe( 'a<br>b' );
	} );

	it( 'should insert line break at start', async () => {
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Enter' );
		expect( await getValue() ).toBe( '<br>a' );
	} );

	it( 'should insert line break in empty container', async () => {
		await page.keyboard.press( 'Enter' );
		expect( await getValue() ).toBe( '<br>' );
	} );
} );
