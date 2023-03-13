/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { PostPendingStatusCheck } from '../check';

describe( 'PostPendingStatusCheck', () => {
	it( "should not render anything if the user doesn't have the right capabilities", () => {
		render(
			<PostPendingStatusCheck hasPublishAction={ false }>
				status
			</PostPendingStatusCheck>
		);
		expect( screen.queryByText( 'status' ) ).not.toBeInTheDocument();
	} );

	it( 'should render if the user has the correct capability', () => {
		render(
			<PostPendingStatusCheck hasPublishAction={ true }>
				status
			</PostPendingStatusCheck>
		);
		expect( screen.getByText( 'status' ) ).toBeVisible();
	} );
} );
