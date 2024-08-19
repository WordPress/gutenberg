/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import NoticeList from '../list';

describe( 'NoticeList', () => {
	it( 'should merge className', async () => {
		await render(
			<NoticeList notices={ [] } className="is-ok">
				List of notices
			</NoticeList>
		);

		const noticeList = screen.getByText( 'List of notices' );
		expect( noticeList ).toHaveClass( 'is-ok' );
		expect( noticeList ).toHaveClass( 'components-notice-list' );
	} );
} );
