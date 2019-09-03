describe( 'RichText with format type', () => {
	const getValue = async () => {
		return await page.evaluate( () => window.test.value );
	};

	beforeEach( async () => {
		await page.goto( 'http://localhost:1234' );
		await page.evaluate( async () => {
			const { render, createElement, RichText, toggleFormat } = window.test;
			const formatTypes = [
				{
					name: 'strong',
					title: 'Bold',
					tagName: 'strong',
					className: null,
					edit( { value, onChange } ) {
						const onClick = () =>
							onChange( toggleFormat( value, { type: 'strong' } ) );

						return createElement( 'button', { onClick }, 'Bold' );
					},
				},
			];
			const onChange = ( newValue ) => window.test.value = newValue;
			const element = createElement( RichText, {
				onChange,
				formatTypes,
			} );
			const container = document.querySelector( 'div' );

			return new Promise( ( resolve ) => {
				render( element, container, resolve );
			} );
		} );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
	} );

	it( 'should load without triggering a change', async () => {
		await page.click( 'button' );
		await page.keyboard.type( '1' );
		expect( await getValue() ).toBe( '<strong>1</strong>' );
	} );
} );
