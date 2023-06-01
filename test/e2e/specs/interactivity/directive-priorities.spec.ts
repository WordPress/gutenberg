/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Directives (w/ priority)', () => {
	test.beforeEach( async ( { goToFile } ) => {
		await goToFile( 'directive-priorities.html' );
	} );

	test( 'should run in priority order', async ( { page } ) => {
		const executionOrder = page.getByTestId( 'execution order' );
		await expect( executionOrder ).toHaveText(
			'context, attribute, text, children'
		);
	} );

	test( 'should wrap those with less priority', async ( { page } ) => {
		// Check that attribute value is correctly received from Provider.
		const element = page.getByTestId( 'test directives' );
		await expect( element ).toHaveAttribute(
			'data-attribute',
			'from context'
		);

		// Check that text value is correctly received from Provider, and text
		// wrapped with an element with `data-testid=text`.
		const text = element.getByTestId( 'text' );
		await expect( text ).toHaveText( 'from context' );
	} );

	test( 'should propagate element modifications top-down', async ( {
		page,
	} ) => {
		const executionOrder = page.getByTestId( 'execution order' );
		const element = page.getByTestId( 'test directives' );
		const text = element.getByTestId( 'text' );

		// Get buttons.
		const updateAttribute = element.getByRole( 'button', {
			name: 'Update attribute',
		} );
		const updateText = element.getByRole( 'button', {
			name: 'Update text',
		} );

		// Modify `attribute` inside context. This triggers a re-render for the
		// component that wraps the `attribute` directive, evaluating it again.
		// Nested components are re-rendered as well, so their directives are
		// also re-evaluated (note how `text` and `children` have run).
		await updateAttribute.click();
		await expect( element ).toHaveAttribute( 'data-attribute', 'updated' );
		await expect( executionOrder ).toHaveText(
			[
				'context, attribute, text, children',
				'attribute, text, children',
			].join( ', ' )
		);

		// Modify `text` inside context. This triggers a re-render of the
		// component that wraps the `text` directive. In this case, only
		// `children` run as well, right after `text`.
		await updateText.click();
		await expect( element ).toHaveAttribute( 'data-attribute', 'updated' );
		await expect( text ).toHaveText( 'updated' );
		await expect( executionOrder ).toHaveText(
			[
				'context, attribute, text, children',
				'attribute, text, children',
				'text, children',
			].join( ', ' )
		);
	} );
} );
