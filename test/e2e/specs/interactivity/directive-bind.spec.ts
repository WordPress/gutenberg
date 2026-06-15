/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'data-wp-bind', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-bind' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-bind' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'add missing href at hydration', async ( { page } ) => {
		const el = page.getByTestId( 'add missing href at hydration' );
		await expect( el ).toHaveAttribute( 'href', '/some-url' );
	} );

	test( 'change href at hydration', async ( { page } ) => {
		const el = page.getByTestId( 'change href at hydration' );
		await expect( el ).toHaveAttribute( 'href', '/some-url' );
	} );

	test( 'update missing href at hydration', async ( { page } ) => {
		const el = page.getByTestId( 'add missing href at hydration' );
		await expect( el ).toHaveAttribute( 'href', '/some-url' );
		await page.getByTestId( 'toggle' ).click();
		await expect( el ).toHaveAttribute( 'href', '/some-other-url' );
	} );

	test( 'add missing checked at hydration', async ( { page } ) => {
		const el = page.getByTestId( 'add missing checked at hydration' );
		await expect( el ).toBeChecked();
	} );

	test( 'remove existing checked at hydration', async ( { page } ) => {
		const el = page.getByTestId( 'remove existing checked at hydration' );
		await expect( el ).not.toBeChecked();
	} );

	test( 'update existing checked', async ( { page } ) => {
		const el = page.getByTestId( 'add missing checked at hydration' );
		const el2 = page.getByTestId( 'remove existing checked at hydration' );
		let checked = await el.evaluate(
			( element: HTMLInputElement ) => element.checked
		);
		let checked2 = await el2.evaluate(
			( element: HTMLInputElement ) => element.checked
		);
		expect( checked ).toBe( true );
		expect( checked2 ).toBe( false );
		await page.getByTestId( 'toggle' ).click();
		checked = await el.evaluate(
			( element: HTMLInputElement ) => element.checked
		);
		checked2 = await el2.evaluate(
			( element: HTMLInputElement ) => element.checked
		);
		expect( checked ).toBe( false );
		expect( checked2 ).toBe( true );
	} );

	test( 'nested binds', async ( { page } ) => {
		const el = page.getByTestId( 'nested binds - 1' );
		await expect( el ).toHaveAttribute( 'href', '/some-url' );
		const el2 = page.getByTestId( 'nested binds - 2' );
		await expect( el2 ).toHaveAttribute( 'width', '1' );
		await page.getByTestId( 'toggle' ).click();
		await expect( el ).toHaveAttribute( 'href', '/some-other-url' );
		await expect( el2 ).toHaveAttribute( 'width', '2' );
	} );

	test( 'check enumerated attributes with true/false values', async ( {
		page,
	} ) => {
		const el = page.getByTestId(
			'check enumerated attributes with true/false exist and have a string value'
		);
		await expect( el ).toHaveAttribute( 'hidden', '' );
		await expect( el ).toHaveAttribute( 'aria-hidden', 'true' );
		await expect( el ).toHaveAttribute( 'aria-expanded', 'false' );
		await expect( el ).toHaveAttribute( 'data-some-value', 'false' );
		await page.getByTestId( 'toggle' ).click();
		await expect( el ).not.toHaveAttribute( 'hidden', '' );
		await expect( el ).toHaveAttribute( 'aria-hidden', 'false' );
		await expect( el ).toHaveAttribute( 'aria-expanded', 'true' );
		await expect( el ).toHaveAttribute( 'data-some-value', 'true' );
	} );

	test.describe( 'attribute hydration', () => {
		/**
		 * Data structure to define a hydration test case.
		 */
		type MatrixEntry = {
			/**
			 * Test ID of the element (the `data-testid` attr).
			 */
			testid: string;
			/**
			 *  Name of the attribute being hydrated.
			 */
			name: string;
			/**
			 * Array of different values to test.
			 */
			values: Record<
				/**
				 * The type of value we are hydrating. E.g., false is `false`,
				 * undef is `undefined`, emptyString is `''`, etc.
				 */
				string,
				[
					/**
					 * Value that the attribute should contain after hydration.
					 * If the attribute is missing, this value is `null`.
					 */
					attributeValue: any,
					/**
					 * Value that the HTMLElement instance property should
					 * contain after hydration.
					 */
					entityPropValue: any,
					/**
					 * Value that the attribute should contain after Preact
					 * renders the same value. If omitted, the hydration value
					 * is used.
					 */
					renderedAttributeValue?: any,
					/**
					 * Value that the HTMLElement instance property should
					 * contain after Preact renders the same value. If omitted,
					 * the hydration value is used.
					 */
					renderedEntityPropValue?: any,
				]
			>;
		};

		const matrix: MatrixEntry[] = [
			{
				testid: 'image',
				name: 'width',
				values: {
					false: [ null, 5 ],
					true: [ 'true', 5 ],
					null: [ null, 5 ],
					undef: [ null, 5 ],
					emptyString: [ '', 5 ],
					anyString: [ 'any', 5 ],
					number: [ '10', 10 ],
				},
			},
			{
				testid: 'input',
				name: 'name',
				values: {
					false: [ 'false', 'false' ],
					true: [ 'true', 'true' ],
					null: [ '', '' ],
					undef: [ '', '' ],
					emptyString: [ '', '' ],
					anyString: [ 'any', 'any' ],
					number: [ '10', '10' ],
				},
			},
			{
				testid: 'input',
				name: 'value',
				values: {
					false: [ null, 'false' ],
					true: [ null, 'true' ],
					null: [ null, '', null, 'tacocat' ],
					undef: [ null, '', null, 'tacocat' ],
					emptyString: [ null, '' ],
					anyString: [ null, 'any' ],
					number: [ null, '10' ],
				},
			},
			{
				testid: 'input',
				name: 'disabled',
				values: {
					false: [ null, false ],
					true: [ '', true ],
					null: [ null, false ],
					undef: [ null, false ],
					emptyString: [ null, false ],
					anyString: [ '', true ],
					number: [ '', true ],
				},
			},
			{
				testid: 'input',
				name: 'aria-disabled',
				values: {
					false: [ 'false', undefined ],
					true: [ 'true', undefined ],
					null: [ null, undefined ],
					undef: [ null, undefined ],
					emptyString: [ '', undefined ],
					anyString: [ 'any', undefined ],
					number: [ '10', undefined ],
				},
			},
			{
				testid: 'popover',
				name: 'popover',
				values: {
					false: [ null, null ],
					true: [ '', 'auto' ],
					null: [ null, null ],
					undef: [ null, null ],
					emptyString: [ '', 'auto' ],
					anyString: [ 'any', 'manual' ],
					number: [ '10', 'manual' ],
					auto: [ 'auto', 'auto' ],
					manual: [ 'manual', 'manual' ],
					hint: [ 'hint', 'hint' ],
				},
			},
		];

		for ( const { testid, name, values } of matrix ) {
			test( `${ name } is correctly hydrated for different values`, async ( {
				page,
			} ) => {
				for ( const type in values ) {
					const [
						attrValue,
						propValue,
						renderedAttrValue = attrValue,
						renderedPropValue = propValue,
					] = values[ type ];

					const container = page.getByTestId( `hydrating ${ type }` );
					const el = container.getByTestId( testid );
					const toggle = container.getByTestId( 'toggle value' );

					// Ensure hydration has happened.
					const checkbox = page.getByTestId(
						'add missing checked at hydration'
					);
					await expect( checkbox ).toBeChecked();

					const hydratedAttr = await el.getAttribute( name );
					const hydratedProp = await el.evaluate(
						( node, propName ) => ( node as any )[ propName ],
						name
					);
					expect( [ type, hydratedAttr ] ).toEqual( [
						type,
						attrValue,
					] );
					expect( [ type, hydratedProp ] ).toEqual( [
						type,
						propValue,
					] );

					await toggle.click();
					await expect( toggle ).toHaveAttribute(
						'data-toggle-count',
						'1'
					);
					await toggle.click();

					// Ensure values have been updated after toggling.
					await expect( toggle ).toHaveAttribute(
						'data-toggle-count',
						'2'
					);

					const renderedAttr = await el.getAttribute( name );
					const renderedProp = await el.evaluate(
						( node, propName ) => ( node as any )[ propName ],
						name
					);
					expect( [ type, renderedAttr ] ).toEqual( [
						type,
						renderedAttrValue,
					] );
					expect( [ type, renderedProp ] ).toEqual( [
						type,
						renderedPropValue,
					] );
				}
			} );
		}
	} );

	test( 'should ignore unique ids', async ( { page } ) => {
		let element = page.getByTestId( 'without-unique-id' );
		await expect( element ).toHaveAttribute( 'data-test' );

		element = page.getByTestId( 'with-unique-id' );
		await expect( element ).not.toHaveAttribute( 'data-test' );
		await expect( element ).not.toHaveAttribute( 'data-test---unique-id' );
	} );
} );
