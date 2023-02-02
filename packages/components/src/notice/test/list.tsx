/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import NoticeList from '../list';

describe( 'NoticeList', () => {
	it( 'should merge className', () => {
		render(
			<NoticeList notices={ [] } className="is-ok">
				List of notices
			</NoticeList>
		);

		const noticeList = screen.getByText( 'List of notices' );
		expect( noticeList ).toHaveClass( 'is-ok' );
		expect( noticeList ).toHaveClass( 'components-notice-list' );
	} );
} );
