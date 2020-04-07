/**
 * Internal dependencies
 */
import { getPageError } from '../get-page-error';

describe( 'getPageError', () => {
	let originalPage;

	beforeEach( () => {
		originalPage = global.page;
	} );

	afterEach( () => {
		global.page = originalPage;
	} );

	it( 'resolves to null if there is no error', async () => {
		global.page = {
			content: () => 'Happy!',
		};

		expect( await getPageError() ).toBe( null );
	} );

	it.each( [
		[
			'PHP, HTML',
			'<b>Notice</b>:  Undefined property: WP_Block_Type_Registry::$x in <b>/var/www/html/wp-content/plugins/gutenberg/lib/blocks.php</b> on line <b>47</b>',
		],
		[
			'PHP, Plaintext',
			'Notice: Undefined property: WP_Block_Type_Registry::$x in /var/www/html/wp-content/plugins/gutenberg/lib/blocks.php on line 47',
		],
	] )(
		'resolves to the error message if there is an error (%s)',
		async ( _variant, error ) => {
			global.page = {
				content: () => error,
			};

			expect( await getPageError() ).toBe( error );
		}
	);
} );
