/**
 * Internal dependencies
 */
import { hasPageError } from '../has-page-error';

describe( 'hasPageError', () => {
	let originalPage;

	beforeEach( () => {
		originalPage = global.page;
	} );

	afterEach( () => {
		global.page = originalPage;
	} );

	it( 'returns false if there is no error', async () => {
		global.page = {
			content: () => 'Happy!',
		};

		expect( await hasPageError() ).toBe( false );
	} );

	it.each( [
		[
			'PHP, HTML',
			'<b>Notice</b>:  Undefined property: WP_Block_Type_Registry::$x in <b>/var/www/html/wp-content/plugins/gutenberg/lib/blocks.php</b> on line <b>47</b><br />',
		],
		[
			'PHP, Plaintext',
			'Notice: Undefined property: WP_Block_Type_Registry::$x in /var/www/html/wp-content/plugins/gutenberg/lib/blocks.php on line 47',
		],
	] )(
		'returns true if there is an error (%s)',
		async ( _variant, error ) => {
			global.page = {
				content: () => error,
			};

			expect( await hasPageError() ).toBe( true );
		}
	);
} );
