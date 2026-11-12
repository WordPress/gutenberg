import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect } from '@wordpress/data';
import NavigationMenuRevisionsButton from '../navigation-menu-revisions-button';

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

function mockRevisions( lastRevisionId: number | null, count: number ) {
	vi.mocked( useSelect ).mockReturnValue( {
		lastRevisionId,
		revisionsCount: count,
	} );
}

describe( 'NavigationMenuRevisionsButton', () => {
	beforeEach( () => {
		vi.mocked( useSelect ).mockReset();
	} );

	it( 'is hidden with fewer than two revisions', () => {
		mockRevisions( 3, 1 );
		render( <NavigationMenuRevisionsButton menuId={ 7 } /> );

		expect(
			screen.queryByRole( 'button', { name: 'View revisions' } )
		).not.toBeInTheDocument();
	} );

	it( 'opens the latest revision through the editor when it can navigate', async () => {
		mockRevisions( 12, 4 );
		const onNavigateToEntityRecord = vi.fn();
		render(
			<NavigationMenuRevisionsButton
				menuId={ 7 }
				onNavigateToEntityRecord={ onNavigateToEntityRecord }
			/>
		);

		await userEvent.click(
			screen.getByRole( 'button', { name: 'View revisions' } )
		);

		expect( onNavigateToEntityRecord ).toHaveBeenCalledWith( {
			postId: 7,
			postType: 'wp_navigation',
			revisionId: 12,
		} );
	} );

	it( 'links to the revisions screen when the editor cannot navigate', () => {
		mockRevisions( 12, 4 );
		render( <NavigationMenuRevisionsButton menuId={ 7 } /> );

		expect(
			screen.getByRole( 'link', { name: 'View revisions' } )
		).toHaveAttribute( 'href', 'revision.php?revision=12' );
	} );
} );
