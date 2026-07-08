/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'data-wp-input', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-input' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-input' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	/* ------------------------------------------------------------------ */
	/*  1. Text input                                                      */
	/* ------------------------------------------------------------------ */
	test( 'should bind text input value to state', async ( { page } ) => {
		const output = page.getByTestId( 'text-output' );
		const input = page.getByTestId( 'text-input' );

		await expect( output ).toHaveText( 'hello' );
		await input.fill( 'world' );
		await expect( output ).toHaveText( 'world' );

		const ctxOutput = page.getByTestId( 'ctx-text-output' );
		const ctxInput = page.getByTestId( 'ctx-text-input' );
		await expect( ctxOutput ).toHaveText( 'ctx-hello' );
		await ctxInput.fill( 'ctx-world' );
		await expect( ctxOutput ).toHaveText( 'ctx-world' );
	} );

	/* ------------------------------------------------------------------ */
	/*  2. Checkbox (boolean)                                              */
	/* ------------------------------------------------------------------ */
	test( 'should bind checkbox checked to state', async ( { page } ) => {
		const output = page.getByTestId( 'checkbox-output' );
		const input = page.getByTestId( 'checkbox-input' );

		await expect( output ).toHaveText( 'false' );
		await input.check();
		await expect( output ).toHaveText( 'true' );
		await input.uncheck();
		await expect( output ).toHaveText( 'false' );

		const ctxOutput = page.getByTestId( 'ctx-checkbox-output' );
		const ctxInput = page.getByTestId( 'ctx-checkbox-input' );
		await expect( ctxOutput ).toHaveText( 'false' );
		await ctxInput.check();
		await expect( ctxOutput ).toHaveText( 'true' );
		await ctxInput.uncheck();
		await expect( ctxOutput ).toHaveText( 'false' );
	} );

	/* ------------------------------------------------------------------ */
	/*  3. Number (type preservation)                                      */
	/* ------------------------------------------------------------------ */
	test( 'should preserve number type for number inputs', async ( {
		page,
	} ) => {
		const output = page.getByTestId( 'number-output' );
		const input = page.getByTestId( 'number-input' );

		await expect( output ).toHaveText( '0' );
		await input.fill( '42' );
		await expect( output ).toHaveText( '42' );

		const ctxOutput = page.getByTestId( 'ctx-number-output' );
		const ctxInput = page.getByTestId( 'ctx-number-input' );
		await expect( ctxOutput ).toHaveText( '0' );
		await ctxInput.fill( '77' );
		await expect( ctxOutput ).toHaveText( '77' );
	} );

	/* ------------------------------------------------------------------ */
	/*  4. Single select                                                   */
	/* ------------------------------------------------------------------ */
	test( 'should bind select element value to state', async ( { page } ) => {
		const output = page.getByTestId( 'select-output' );
		const input = page.getByTestId( 'select-input' );

		await expect( output ).toHaveText( 'dog' );
		await input.selectOption( 'cat' );
		await expect( output ).toHaveText( 'cat' );

		const ctxOutput = page.getByTestId( 'ctx-select-output' );
		const ctxInput = page.getByTestId( 'ctx-select-input' );
		await expect( ctxOutput ).toHaveText( 'dog' );
		await ctxInput.selectOption( 'cat' );
		await expect( ctxOutput ).toHaveText( 'cat' );
	} );

	/* ------------------------------------------------------------------ */
	/*  4b. Single select (no default)                                     */
	/* ------------------------------------------------------------------ */
	test( 'should work for single select with no pre-selected option', async ( {
		page,
	} ) => {
		const output = page.getByTestId( 'select-none-output' );
		const input = page.getByTestId( 'select-none-input' );

		await expect( output ).toHaveText( '' );
		await input.selectOption( 'x' );
		await expect( output ).toHaveText( 'x' );
	} );

	/* ------------------------------------------------------------------ */
	/*  5. Radio group                                                     */
	/* ------------------------------------------------------------------ */
	test( 'should bind radio button value to state', async ( { page } ) => {
		const output = page.getByTestId( 'radio-output' );
		const radioDog = page.getByTestId( 'radio-dog' );
		const radioCat = page.getByTestId( 'radio-cat' );

		await expect( output ).toHaveText( 'dog' );
		await expect( radioDog ).toBeChecked();
		await expect( radioCat ).not.toBeChecked();

		await radioCat.check();
		await expect( output ).toHaveText( 'cat' );
		await expect( radioDog ).not.toBeChecked();
		await expect( radioCat ).toBeChecked();

		const ctxOutput = page.getByTestId( 'ctx-radio-output' );
		const ctxRadioCat = page.getByTestId( 'ctx-radio-cat' );
		await expect( ctxOutput ).toHaveText( 'dog' );
		await ctxRadioCat.check();
		await expect( ctxOutput ).toHaveText( 'cat' );
	} );

	/* ------------------------------------------------------------------ */
	/*  5b. Radio group (no default)                                       */
	/* ------------------------------------------------------------------ */
	test( 'should work for radio with no pre-selected option', async ( {
		page,
	} ) => {
		const output = page.getByTestId( 'radio-none-output' );
		const radioX = page.getByTestId( 'radio-none-x' );
		const radioY = page.getByTestId( 'radio-none-y' );

		await expect( output ).toHaveText( '' );
		await expect( radioX ).not.toBeChecked();
		await expect( radioY ).not.toBeChecked();

		await radioY.check();
		await expect( output ).toHaveText( 'y' );
		await expect( radioX ).not.toBeChecked();
		await expect( radioY ).toBeChecked();
	} );

	/* ------------------------------------------------------------------ */
	/*  6. Range (type preservation)                                       */
	/* ------------------------------------------------------------------ */
	test( 'should preserve number type for range inputs', async ( {
		page,
	} ) => {
		const output = page.getByTestId( 'range-output' );
		const input = page.getByTestId( 'range-input' );

		await expect( output ).toHaveText( '50' );
		await input.fill( '75' );
		await expect( output ).toHaveText( '75' );

		const ctxOutput = page.getByTestId( 'ctx-range-output' );
		const ctxInput = page.getByTestId( 'ctx-range-input' );
		await expect( ctxOutput ).toHaveText( '50' );
		await ctxInput.fill( '25' );
		await expect( ctxOutput ).toHaveText( '25' );
	} );

	/* ------------------------------------------------------------------ */
	/*  7. Textarea                                                        */
	/* ------------------------------------------------------------------ */
	test( 'should bind textarea value to state', async ( { page } ) => {
		const output = page.getByTestId( 'textarea-output' );
		const input = page.getByTestId( 'textarea-input' );

		await expect( output ).toHaveText( 'default' );
		await input.fill( 'updated' );
		await expect( output ).toHaveText( 'updated' );

		const ctxOutput = page.getByTestId( 'ctx-textarea-output' );
		const ctxInput = page.getByTestId( 'ctx-textarea-input' );
		await expect( ctxOutput ).toHaveText( 'default' );
		await ctxInput.fill( 'modified' );
		await expect( ctxOutput ).toHaveText( 'modified' );
	} );

	/* ------------------------------------------------------------------ */
	/*  8. Multiple select                                                 */
	/* ------------------------------------------------------------------ */
	test( 'should update multi-select when signal changes via toggle', async ( {
		page,
	} ) => {
		const input = page.getByTestId( 'multiselect-input' );
		const toggleBtn = page.getByTestId( 'toggle-multipet' );

		// Initial: 'dog' selected (from store).
		expect(
			await input.evaluate( ( el: HTMLSelectElement ) =>
				Array.from( el.selectedOptions ).map( ( o ) => o.value )
			)
		).toEqual( [ 'dog' ] );

		// Toggle → state.multiPet becomes ['cat', 'bird'].
		await toggleBtn.click();
		expect(
			await input.evaluate( ( el: HTMLSelectElement ) =>
				Array.from( el.selectedOptions ).map( ( o ) => o.value )
			)
		).toEqual( [ 'cat', 'bird' ] );

		// Toggle back → state.multiPet becomes ['dog'].
		await toggleBtn.click();
		expect(
			await input.evaluate( ( el: HTMLSelectElement ) =>
				Array.from( el.selectedOptions ).map( ( o ) => o.value )
			)
		).toEqual( [ 'dog' ] );
	} );

	/* ------------------------------------------------------------------ */
	/*  9. Checkbox group (explicit indices → array)                       */
	/* ------------------------------------------------------------------ */
	test( 'should bind checkbox group with top-level properties', async ( {
		page,
	} ) => {
		const outputA = page.getByTestId( 'checkbox-group-output-a' );
		const outputB = page.getByTestId( 'checkbox-group-output-b' );
		const checkboxA = page.getByTestId( 'checkbox-group-a' );
		const checkboxB = page.getByTestId( 'checkbox-group-b' );

		// Initial: A checked (state.tags0 = 'a'), B unchecked (state.tags1 = '').
		await expect( outputA ).toHaveText( 'a' );
		await expect( outputB ).toHaveText( '' );
		await expect( checkboxA ).toBeChecked();
		await expect( checkboxB ).not.toBeChecked();

		// Check B → tags1 = 'b'.
		await checkboxB.check();
		await expect( outputB ).toHaveText( 'b' );
		await expect( checkboxB ).toBeChecked();

		// Uncheck B → tags1 = ''.
		await checkboxB.uncheck();
		await expect( outputB ).toHaveText( '' );
		await expect( checkboxB ).not.toBeChecked();
	} );

	/* ------------------------------------------------------------------ */
	/*  10. Update input elements when signal changes via toggle actions                              */
	/* ------------------------------------------------------------------ */
	test( 'should update text input value when signal changes via action', async ( {
		page,
	} ) => {
		const output = page.getByTestId( 'text-output' );
		const input = page.getByTestId( 'text-input' );
		const toggleBtn = page.getByTestId( 'toggle-text' );

		await expect( output ).toHaveText( 'hello' );
		await expect( input ).toHaveValue( 'hello' );

		await toggleBtn.click();
		await expect( output ).toHaveText( 'world' );
		await expect( input ).toHaveValue( 'world' );

		await toggleBtn.click();
		await expect( output ).toHaveText( 'hello' );
		await expect( input ).toHaveValue( 'hello' );

		const ctxOutput = page.getByTestId( 'ctx-text-output' );
		const ctxInput = page.getByTestId( 'ctx-text-input' );
		const ctxToggleBtn = page.getByTestId( 'toggle-ctx-text' );
		await expect( ctxOutput ).toHaveText( 'ctx-hello' );
		await expect( ctxInput ).toHaveValue( 'ctx-hello' );

		await ctxToggleBtn.click();
		await expect( ctxOutput ).toHaveText( 'ctx-world' );
		await expect( ctxInput ).toHaveValue( 'ctx-world' );

		await ctxToggleBtn.click();
		await expect( ctxOutput ).toHaveText( 'ctx-hello' );
		await expect( ctxInput ).toHaveValue( 'ctx-hello' );
	} );

	test( 'should update checkbox when signal changes via action', async ( {
		page,
	} ) => {
		const output = page.getByTestId( 'checkbox-output' );
		const input = page.getByTestId( 'checkbox-input' );
		const toggleBtn = page.getByTestId( 'toggle-checked' );

		await expect( output ).toHaveText( 'false' );
		await expect( input ).not.toBeChecked();

		await toggleBtn.click();
		await expect( output ).toHaveText( 'true' );
		await expect( input ).toBeChecked();

		await toggleBtn.click();
		await expect( output ).toHaveText( 'false' );
		await expect( input ).not.toBeChecked();

		const ctxOutput = page.getByTestId( 'ctx-checkbox-output' );
		const ctxInput = page.getByTestId( 'ctx-checkbox-input' );
		const ctxToggleBtn = page.getByTestId( 'toggle-ctx-checked' );
		await expect( ctxOutput ).toHaveText( 'false' );
		await ctxToggleBtn.click();
		await expect( ctxOutput ).toHaveText( 'true' );
		await expect( ctxInput ).toBeChecked();
		await ctxToggleBtn.click();
		await expect( ctxOutput ).toHaveText( 'false' );
		await expect( ctxInput ).not.toBeChecked();
	} );

	test( 'should update number input when signal changes via action', async ( {
		page,
	} ) => {
		const output = page.getByTestId( 'number-output' );
		const input = page.getByTestId( 'number-input' );
		const toggleBtn = page.getByTestId( 'toggle-num' );

		await expect( output ).toHaveText( '0' );
		await expect( input ).toHaveValue( '0' );

		await toggleBtn.click();
		await expect( output ).toHaveText( '99' );
		await expect( input ).toHaveValue( '99' );

		const ctxOutput = page.getByTestId( 'ctx-number-output' );
		const ctxInput = page.getByTestId( 'ctx-number-input' );
		const ctxToggleBtn = page.getByTestId( 'toggle-ctx-num' );
		await expect( ctxOutput ).toHaveText( '0' );
		await ctxToggleBtn.click();
		await expect( ctxOutput ).toHaveText( '99' );
		await expect( ctxInput ).toHaveValue( '99' );
	} );

	test( 'should update select when signal changes via action', async ( {
		page,
	} ) => {
		const output = page.getByTestId( 'select-output' );
		const input = page.getByTestId( 'select-input' );
		const toggleBtn = page.getByTestId( 'toggle-pet' );

		await expect( output ).toHaveText( 'dog' );
		await expect( input ).toHaveValue( 'dog' );

		await toggleBtn.click();
		await expect( output ).toHaveText( 'cat' );
		await expect( input ).toHaveValue( 'cat' );

		await toggleBtn.click();
		await expect( output ).toHaveText( 'bird' );

		await toggleBtn.click();
		await expect( output ).toHaveText( 'dog' );

		const ctxOutput = page.getByTestId( 'ctx-select-output' );
		const ctxInput = page.getByTestId( 'ctx-select-input' );
		const ctxToggleBtn = page.getByTestId( 'toggle-ctx-pet' );
		await expect( ctxOutput ).toHaveText( 'dog' );
		await ctxToggleBtn.click();
		await expect( ctxOutput ).toHaveText( 'cat' );
		await expect( ctxInput ).toHaveValue( 'cat' );
		await ctxToggleBtn.click();
		await expect( ctxOutput ).toHaveText( 'bird' );
		await ctxToggleBtn.click();
		await expect( ctxOutput ).toHaveText( 'dog' );
	} );

	/* ------------------------------------------------------------------ */
	/*  15. File input                                                     */
	/* ------------------------------------------------------------------ */
	test( 'should handle file input', async ( { page } ) => {
		const stateOutput = page.getByTestId( 'file-name-output' );
		const stateInput = page.getByTestId( 'file-input' );

		await expect( stateOutput ).toHaveText( '' );

		await stateInput.setInputFiles( {
			name: 'test.txt',
			mimeType: 'text/plain',
			buffer: Buffer.from( 'hello world' ),
		} );

		// The file input runs FileReader asynchronously; wait for it.
		await page.waitForFunction(
			() => {
				const el = document.querySelector(
					'[data-testid="file-name-output"]'
				);
				return el && el.textContent === 'test.txt';
			},
			undefined,
			{ timeout: 15000 }
		);

		// --- Context variant ---
		const ctxOutput = page.getByTestId( 'ctx-file-name-output' );
		const ctxInput = page.getByTestId( 'ctx-file-input' );

		await expect( ctxOutput ).toHaveText( '' );

		await ctxInput.setInputFiles( {
			name: 'test.txt',
			mimeType: 'text/plain',
			buffer: Buffer.from( 'hello world' ),
		} );

		await page.waitForFunction(
			() => {
				const el = document.querySelector(
					'[data-testid="ctx-file-name-output"]'
				);
				return el && el.textContent === 'test.txt';
			},
			undefined,
			{ timeout: 15000 }
		);
	} );

	/* ------------------------------------------------------------------ */
	/*  11. Element→signal seeding (state undefined → adopt DOM value)     */
	/* ------------------------------------------------------------------ */
	test( 'should retain HTML value and respond to input for undefined state', async ( {
		page,
	} ) => {
		const input = page.getByTestId( 'seed-input' );

		// Input should retain its HTML value after hydration (no clearing).
		await expect( input ).toHaveValue( 'seeded-from-html' );

		// Typing should still update input value.
		await input.fill( 'updated' );
		await expect( input ).toHaveValue( 'updated' );
	} );
} );
