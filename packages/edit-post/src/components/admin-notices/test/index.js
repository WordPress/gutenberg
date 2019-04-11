/**
 * External dependencies
 */
import renderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { AdminNotices } from '../';

describe( 'AdminNotices', () => {
	beforeEach( () => {
		// The superfluous whitespace is intentional in verifying expected
		// outputs of (a) non-element first child of the element (whitespace
		// text node) and (b) untrimmed content.
		document.body.innerHTML = `
			<div id="wpbody-content">
				<div class="notice updated is-dismissible">
					<p>My <strong>notice</strong> text</p>
					<p>My second line of text</p>
					<button type="button" class="notice-dismiss">
						<span class="screen-reader-text">Dismiss this notice.</span>
					</button>
				</div>
				<div class="notice notice-warning">Warning</div>
				<aside class="elsewhere">
					<div class="notice">Ignore me</div>
				</aside>
			</div>
		`;
	} );

	it( 'should upgrade notices', () => {
		const createNotice = jest.fn();

		renderer.create( <AdminNotices createNotice={ createNotice } /> );

		expect( createNotice ).toHaveBeenCalledTimes( 2 );
		expect( createNotice.mock.calls[ 0 ] ).toEqual( [
			'warning',
			'Warning',
			{
				speak: false,
				__unstableHTML: true,
				isDismissible: false,
			},
		] );
		expect( createNotice.mock.calls[ 1 ] ).toEqual( [
			'success',
			'<p>My <strong>notice</strong> text</p><p>My second line of text</p>',
			{
				speak: false,
				__unstableHTML: true,
				isDismissible: true,
			},
		] );

		// Verify all but `<aside>` are removed.
		expect( document.getElementById( 'wpbody-content' ).childElementCount ).toBe( 1 );
	} );
} );
