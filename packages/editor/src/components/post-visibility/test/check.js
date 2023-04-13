/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { PostVisibilityCheck } from '../check';

describe( 'PostVisibilityCheck', () => {
	const renderProp = ( { canEdit } ) => ( canEdit ? 'yes' : 'no' );

	it( "should not render the edit link if the user doesn't have the right capability", () => {
		render(
			<PostVisibilityCheck
				hasPublishAction={ false }
				render={ renderProp }
			/>
		);
		expect( screen.queryByText( 'yes' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'no' ) ).toBeVisible();
	} );

	it( 'should render if the user has the correct capability', () => {
		render(
			<PostVisibilityCheck
				hasPublishAction={ true }
				render={ renderProp }
			/>
		);
		expect( screen.queryByText( 'no' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'yes' ) ).toBeVisible();
	} );
} );
