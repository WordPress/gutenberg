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
			<div class="notice notice-success is-dismissible">
				<p>
					My <strong>notice</strong> text
				</p>
				<button type="button" class="notice-dismiss">
					<span class="screen-reader-text">Dismiss this notice.</span>
				</button>
			</div>
		`;
	} );

	it( 'should upgrade notices', () => {
		const createNotice = jest.fn();

		renderer.create( <AdminNotices createNotice={ createNotice } /> );

		expect( createNotice ).toHaveBeenCalledWith( {
			status: 'success',
			isDismissible: true,
			content: 'My notice text',
			__unstableHTML: 'My <strong>notice</strong> text',
		} );
		expect( document.body.childElementCount ).toBe( 0 );
	} );
} );
