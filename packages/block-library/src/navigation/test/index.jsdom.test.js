import { beforeEach, describe, expect, it, vi } from 'vitest';
import { select } from '@wordpress/data';
import getNavigationMenuLabel from '../get-navigation-menu-label';

vi.mock( import( '@wordpress/data' ), () => ( {
	select: vi.fn(),
} ) );

vi.mock( import( '@wordpress/core-data' ), () => ( {
	store: { name: 'core' },
} ) );

describe( 'getNavigationMenuLabel', () => {
	const getEntityRecord = vi.fn();
	const getEditedEntityRecord = vi.fn();
	const canUser = vi.fn();

	beforeEach( () => {
		vi.clearAllMocks();
		select.mockReturnValue( {
			canUser,
			getEntityRecord,
			getEditedEntityRecord,
		} );
	} );

	it( 'does not load an entity before update permission resolves', () => {
		canUser.mockReturnValue( undefined );

		expect( getNavigationMenuLabel( { ref: 6 } ) ).toBeUndefined();
		expect( getEntityRecord ).not.toHaveBeenCalled();
		expect( getEditedEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'uses the view-context title without loading an editable entity for a read-only user', () => {
		canUser.mockReturnValue( false );
		getEntityRecord.mockReturnValue( {
			title: { rendered: 'Read-only &amp; safe' },
		} );

		expect( getNavigationMenuLabel( { ref: 7 } ) ).toBe(
			'Read-only & safe'
		);
		expect( getEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'wp_navigation',
			7,
			{ context: 'view' }
		);
		expect( getEditedEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'uses the edited title when the user can update the menu', () => {
		canUser.mockReturnValue( true );
		getEditedEntityRecord.mockReturnValue( {
			title: 'Editable &amp; current',
		} );

		expect( getNavigationMenuLabel( { ref: 8 } ) ).toBe(
			'Editable & current'
		);
		expect( getEditedEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'wp_navigation',
			8
		);
		expect( getEntityRecord ).not.toHaveBeenCalled();
	} );
} );
