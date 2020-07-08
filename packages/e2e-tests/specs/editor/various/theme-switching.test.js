/**
 * WordPress dependencies
 */
import {
	activateTheme,
	createNewPost,
	deleteTheme,
	insertBlock,
	installTheme,
	publishPost,
	themeInstalled,
} from '@wordpress/e2e-test-utils';

const defaultTheme = 'twentytwenty';

// These can be any themes available from wordpress.org that don't themselves cause editor errors.
const testThemes = [ [ 'primer' ], [ 'astra' ] ];

describe( 'Theme switching', () => {
	it.each( testThemes )(
		'can switch themes without breaking the editor',
		async ( testTheme ) => {
			await installTheme( testTheme );

			expect( await themeInstalled( testTheme ) ).toBe( true );

			await activateTheme( testTheme );

			await createNewPost( { title: 'Test theme switching' } );
			await expect( page ).toMatchElement( '.editor-post-title__input', {
				text: 'Test theme switching',
			} );

			await insertBlock( 'Heading' );
			await page.keyboard.type( 'Test heading' );
			await expect( page ).toMatchElement( 'h2', {
				text: 'Test heading',
			} );

			await publishPost();
			await expect( page ).toMatchElement( 'a.components-button', {
				text: 'View Post',
			} );

			await deleteTheme( testTheme, defaultTheme );

			expect( await themeInstalled( testTheme ) ).toBe( false );
		}
	);
} );
