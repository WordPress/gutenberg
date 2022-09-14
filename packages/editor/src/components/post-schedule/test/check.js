/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { PostScheduleCheck } from '../check';

describe( 'PostScheduleCheck', () => {
	it( "should not render anything if the user doesn't have the right capabilities", () => {
		render(
			<PostScheduleCheck hasPublishAction={ false }>
				yes
			</PostScheduleCheck>
		);
		expect( screen.queryByText( 'yes' ) ).not.toBeInTheDocument();
	} );

	it( 'should render if the user has the correct capability', () => {
		render(
			<PostScheduleCheck hasPublishAction={ true }>yes</PostScheduleCheck>
		);
		expect( screen.getByText( 'yes' ) ).toBeVisible();
	} );
} );
