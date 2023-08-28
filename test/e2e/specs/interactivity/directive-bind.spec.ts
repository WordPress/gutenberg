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
		await expect( el ).toHaveAttribute( 'checked', '' );
	} );

	test( 'remove existing checked at hydration', async ( { page } ) => {
		const el = page.getByTestId( 'remove existing checked at hydration' );
		await expect( el ).not.toHaveAttribute( 'checked', '' );
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

	// `width`:    using the red-dot image (default value comes from image)
	// `tabIndex`: can be a div (default value is -1)
	// `hidden`:   can be a div (values are treated as boolean)
	// `value`:    a text input (can be any string)
	// `aria-disabled`: an input field
	// `data-disabled`: the same input field

	test.describe( 'attribute hydration', () => {
		const cases = [
			{ type: 'false', attrValues: [ null, 'false' ] },
			{ type: 'true', attrValues: [ '', 'true' ] },
			{ type: 'string "false"', attrValues: [ '', 'false' ] },
			{ type: 'string "true"', attrValues: [ '', 'true' ] },
			{ type: 'null', attrValues: [ null, null ] },
			{ type: 'undefined', attrValues: [ null, null ] },
			{ type: 'empty string', attrValues: [ null, '' ] },
			{ type: 'any string', attrValues: [ '', 'any' ] },
		];

		for ( const {
			type,
			attrValues: [ regularValue, ariaDataValue ],
		} of cases ) {
			test( `works for ${ type } values correctly`, async ( {
				page,
			} ) => {
				const el = page.getByTestId( `hydrating ${ type }` );
				const input = el.getByTestId( 'input' );
				const toggle = el.getByTestId( 'toggle-prop' );

				const initialValues = {
					ariaDisabled: await input.getAttribute( 'aria-disabled' ),
					dataDisabled: await input.getAttribute( 'data-disabled' ),
					disabled: await input.getAttribute( 'disabled' ),
				};

				expect( initialValues.disabled ).toBe( regularValue );
				expect( initialValues.ariaDisabled ).toBe( ariaDataValue );
				expect( initialValues.dataDisabled ).toBe( ariaDataValue );

				// Here we check that the hydrated values match the rendered
				// values.
				await toggle.click( { clickCount: 2, delay: 50 } );

				const finalValues = {
					ariaDisabled: await input.getAttribute( 'aria-disabled' ),
					dataDisabled: await input.getAttribute( 'data-disabled' ),
					disabled: await input.getAttribute( 'disabled' ),
				};

				expect( initialValues.disabled ).toBe( finalValues.disabled );
				expect( initialValues.ariaDisabled ).toBe(
					finalValues.ariaDisabled
				);
				expect( initialValues.dataDisabled ).toBe(
					finalValues.dataDisabled
				);
			} );
		}
	} );
} );
