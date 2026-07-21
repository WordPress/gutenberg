/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import getNavigationMenuLabel from '../get-navigation-menu-label';

jest.mock( '@wordpress/data', () => ( {
	select: jest.fn(),
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: { name: 'core' },
} ) );

describe( 'getNavigationMenuLabel', () => {
	const getEntityRecord = jest.fn();
	const getEditedEntityRecord = jest.fn();
	const canUser = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();
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
