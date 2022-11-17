/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import NoticeList from '../list';

describe( 'NoticeList', () => {
	it( 'should merge className', () => {
		const { container } = render(
			<NoticeList notices={ [] } className="is-ok" />
		);

		expect( container.firstChild ).toHaveClass( 'is-ok' );
		expect( container.firstChild ).toHaveClass( 'components-notice-list' );
	} );
} );
