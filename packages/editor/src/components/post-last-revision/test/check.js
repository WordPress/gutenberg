/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { PostLastRevisionCheck } from '../check';

describe( 'PostLastRevisionCheck', () => {
	it( 'should not render anything if the last revision ID is unknown', () => {
		render(
			<PostLastRevisionCheck revisionsCount={ 2 }>
				Children
			</PostLastRevisionCheck>
		);

		expect( screen.queryByText( 'Children' ) ).not.toBeInTheDocument();
	} );

	it( 'should not render anything if there is only one revision', () => {
		render(
			<PostLastRevisionCheck lastRevisionId={ 1 } revisionsCount={ 1 }>
				Children
			</PostLastRevisionCheck>
		);

		expect( screen.queryByText( 'Children' ) ).not.toBeInTheDocument();
	} );

	it( 'should render if there are two revisions', () => {
		render(
			<PostLastRevisionCheck lastRevisionId={ 1 } revisionsCount={ 2 }>
				Children
			</PostLastRevisionCheck>
		);

		expect( screen.getByText( 'Children' ) ).toBeVisible();
	} );
} );
