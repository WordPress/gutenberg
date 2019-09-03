describe( 'RichText with format type', () => {
	const getValue = async () => {
		return await page.evaluate( () => window.test.value );
	};

	beforeEach( async () => {
		await page.goto( 'http://localhost:1234' );
		await page.evaluate( async () => {
			const { render, createElement, RichText, toggleFormat } = window.test;
			const formatTypes = [
				{ name: 'strong', title: 'Bold' },
				{ name: 'em', title: 'Italic' },
			].map( ( { name, title } ) => ( {
				name,
				title,
				tagName: name,
				className: null,
				edit: ( { value, onChange } ) =>
					createElement( 'button', {
						className: name,
						onClick: () => onChange(
							toggleFormat( value, { type: name } )
						),
					}, title ),
			} ) );
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
		await page.keyboard.press( 'Tab' );
	} );

	it( 'should format on input (click)', async () => {
		// All following characters should now be bold.
		await page.click( 'button.strong' );
		// Type two characters to ensure multiple characters are formatted.
		await page.keyboard.type( '12' );
		// All following characters should no longer be bold.
		await page.click( 'button.strong' );
		await page.keyboard.type( '3' );

		expect( await getValue() ).toBe( '<strong>12</strong>3' );
	} );

	it( 'should format selection (click)', async () => {
		await page.keyboard.type( '1' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.up( 'Shift' );
		await page.click( 'button.strong' );

		expect( await getValue() ).toBe( '<strong>1</strong>' );

		// Expect focus to be returned.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( '2' );

		expect( await getValue() ).toBe( '<strong>1</strong>2' );
	} );

	it( 'should format on input (keyboard)', async () => {
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.up( 'Shift' );
		// All following characters should now be bold.
		await page.keyboard.press( 'Space' );
		// Type two characters to ensure multiple characters are formatted.
		await page.keyboard.type( '12' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.up( 'Shift' );
		// All following characters should no longer be bold.
		await page.keyboard.press( 'Space' );
		await page.keyboard.type( '3' );

		expect( await getValue() ).toBe( '<strong>12</strong>3' );
	} );

	it( 'should format selection (keyboard)', async () => {
		await page.keyboard.type( '1' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.up( 'Shift' );
		await page.keyboard.press( 'Space' );

		expect( await getValue() ).toBe( '<strong>1</strong>' );

		// Expect focus to be returned.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( '2' );

		expect( await getValue() ).toBe( '<strong>1</strong>2' );
	} );

	it( 'should handle `Home` and `End` keys', async () => {
		await page.click( 'button.strong' );
		await page.keyboard.type( '12' );

		await page.keyboard.press( 'Home' );
		await page.keyboard.type( '-' );
		await page.keyboard.press( 'End' );
		await page.keyboard.type( '+' );

		expect( await getValue() ).toBe( '-<strong>12</strong>+' );
	} );

	it( 'should navigate around nested inline boundaries', async () => {
		await page.click( 'button.strong' );
		await page.keyboard.type( '1 2' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.up( 'Shift' );
		await page.click( 'button.em' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.up( 'Shift' );
		await page.click( 'button.em' );
		await page.keyboard.press( 'ArrowLeft' );

		expect( await getValue() ).toBe( '<strong><em>1</em> <em>2</em></strong>' );

		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'b' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'c' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'd' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'e' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'f' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'g' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'h' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'i' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'j' );

		expect( await getValue() ).toBe( 'a<strong>b<em>c1d</em>e f<em>g2h</em>i</strong>j' );
	} );

	it( 'should apply multiple formats when selection is collapsed', async () => {
		await page.click( 'button.strong' );
		await page.click( 'button.em' );
		await page.keyboard.type( '1' );
		await page.click( 'button.em' );
		await page.click( 'button.strong' );
		await page.keyboard.type( '2' );

		expect( await getValue() ).toBe( '<strong><em>1</em></strong>2' );
	} );

	it( 'should not highlight more than one format', async () => {
		await page.click( 'button.strong' );
		await page.keyboard.type( '1' );
		await page.click( 'button.strong' );
		await page.keyboard.type( ' 2' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.up( 'Shift' );
		await page.click( 'button.strong' );

		const count = await page.evaluate( () => document.querySelectorAll(
			'*[data-rich-text-format-boundary]'
		).length );

		expect( count ).toBe( 1 );
	} );

	it( 'should not lose selection direction', async () => {
		await page.click( 'button.strong' );
		await page.keyboard.type( '1' );
		await page.click( 'button.strong' );
		await page.keyboard.type( '24' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.up( 'Shift' );

		// There should be no selection. The following should insert "3" without
		// deleting the numbers.
		await page.keyboard.type( '3' );

		expect( await getValue() ).toBe( '<strong>1</strong>234' );
	} );

	it( 'should navigate inline boundaries (rtl)', async () => {
		// Avoid using three, as it looks too much like two with some fonts.
		const ARABIC_ZERO = '٠';
		const ARABIC_ONE = '١';
		const ARABIC_TWO = '٢';

		await page.evaluate( () => document.dir = 'rtl' );
		await page.click( 'button.strong' );
		await page.keyboard.type( ARABIC_ONE );
		await page.click( 'button.strong' );
		await page.keyboard.type( ARABIC_TWO );

		const expected = [
			`${ ARABIC_ZERO }<strong>${ ARABIC_ONE }</strong>${ ARABIC_TWO }`,
			`<strong>${ ARABIC_ZERO }${ ARABIC_ONE }</strong>${ ARABIC_TWO }`,
			`<strong>${ ARABIC_ONE }${ ARABIC_ZERO }</strong>${ ARABIC_TWO }`,
			`<strong>${ ARABIC_ONE }</strong>${ ARABIC_ZERO }${ ARABIC_TWO }`,
		];

		// Insert a character at each boundary position.
		for ( let i = 3; i >= 0; i-- ) {
			await page.keyboard.press( 'ArrowRight' );
			await page.keyboard.type( ARABIC_ZERO );

			expect( await getValue() ).toBe( expected[ i ] );

			await page.keyboard.press( 'Backspace' );
		}
	} );

	it( 'should only mutate text data on input', async () => {
		await page.keyboard.type( '1' );
		await page.click( 'button.strong' );
		await page.keyboard.type( '2' );
		await page.click( 'button.strong' );
		await page.keyboard.type( '3' );

		await page.evaluate( () => {
			let called;
			const { body } = document;
			const config = {
				attributes: true,
				childList: true,
				characterData: true,
				subtree: true,
			};

			const mutationObserver = new MutationObserver( ( records ) => {
				if ( called || records.length > 1 ) {
					throw new Error( 'Typing should only mutate once.' );
				}

				records.forEach( ( record ) => {
					if ( record.type !== 'characterData' ) {
						throw new Error(
							`Typing mutated more than character data: ${ record.type }`
						);
					}
				} );

				called = true;
			} );

			mutationObserver.observe( body, config );

			window.unsubscribes = [ () => mutationObserver.disconnect() ];

			document.addEventListener( 'selectionchange', () => {
				function throwMultipleSelectionChange() {
					throw new Error( 'Typing should only emit one selection change event.' );
				}

				document.addEventListener(
					'selectionchange',
					throwMultipleSelectionChange,
					{ once: true }
				);

				window.unsubscribes.push( () => {
					document.removeEventListener( 'selectionchange', throwMultipleSelectionChange );
				} );
			}, { once: true } );
		} );

		await page.keyboard.type( '4' );

		await page.evaluate( () => {
			// The selection change event should be called once. If there's only
			// one item in `window.unsubscribes`, it means that only one
			// function is present to disconnect the `mutationObserver`.
			if ( window.unsubscribes.length === 1 ) {
				throw new Error( 'The selection change event listener was never called.' );
			}

			window.unsubscribes.forEach( ( unsubscribe ) => unsubscribe() );
		} );

		expect( await getValue() ).toBe( '1<strong>2</strong>34' );
	} );
} );
