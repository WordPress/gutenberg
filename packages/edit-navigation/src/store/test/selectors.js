/**
 * Internal dependencies
 */
import {
	getNavigationPostForMenu,
	hasResolvedNavigationPost,
	getMenuItemForClientId,
} from '../selectors';
import { KIND, POST_TYPE, buildNavigationPostId } from '../utils';

describe( 'getNavigationPostForMenu', () => {
	it( 'gets navigation post for menu', () => {
		const getEditedEntityRecord = jest.fn( () => 'record' );
		const hasFinishedResolution = jest.fn( () => true );
		const __unstableGetSelect = jest.fn( () => ( {
			getEditedEntityRecord,
			hasFinishedResolution,
		} ) );

		const menuId = 123;

		getNavigationPostForMenu.__unstableGetSelect = __unstableGetSelect;
		hasResolvedNavigationPost.__unstableGetSelect = __unstableGetSelect;

		expect( getNavigationPostForMenu( 'state', menuId ) ).toBe( 'record' );

		expect( __unstableGetSelect ).toHaveBeenCalledWith( 'core' );
		expect( getEditedEntityRecord ).toHaveBeenCalledWith(
			KIND,
			POST_TYPE,
			buildNavigationPostId( menuId )
		);
	} );

	it( 'returns null if has not resolved navigation post yet', () => {
		const getEditedEntityRecord = jest.fn( () => 'record' );
		const hasFinishedResolution = jest.fn( () => false );
		const __unstableGetSelect = jest.fn( () => ( {
			getEditedEntityRecord,
			hasFinishedResolution,
		} ) );

		const menuId = 123;

		getNavigationPostForMenu.__unstableGetSelect = __unstableGetSelect;
		hasResolvedNavigationPost.__unstableGetSelect = __unstableGetSelect;

		expect( getNavigationPostForMenu( 'state', menuId ) ).toBe( null );

		expect( __unstableGetSelect ).toHaveBeenCalledWith( 'core' );
		expect( getEditedEntityRecord ).not.toHaveBeenCalled();
	} );
} );

describe( 'hasResolvedNavigationPost', () => {
	it( 'returns if it has resolved navigation post yet', () => {
		const hasFinishedResolution = jest.fn( () => true );
		const __unstableGetSelect = jest.fn( () => ( {
			hasFinishedResolution,
		} ) );

		const menuId = 123;

		hasResolvedNavigationPost.__unstableGetSelect = __unstableGetSelect;

		expect( hasResolvedNavigationPost( 'state', menuId ) ).toBe( true );

		expect( __unstableGetSelect ).toHaveBeenCalledWith( 'core' );
		expect( hasFinishedResolution ).toHaveBeenCalledWith(
			'getEntityRecord',
			[ KIND, POST_TYPE, buildNavigationPostId( menuId ) ]
		);
	} );
} );

describe( 'getMenuItemForClientId', () => {
	it( 'gets menu item for client id', () => {
		const getMenuItem = jest.fn( () => 'menuItem' );

		const __unstableGetSelect = jest.fn( () => ( {
			getMenuItem,
		} ) );

		const state = {
			mapping: {
				postId: {
					123: 'clientId',
				},
			},
		};

		getMenuItemForClientId.__unstableGetSelect = __unstableGetSelect;

		expect( getMenuItemForClientId( state, 'postId', 'clientId' ) ).toBe(
			'menuItem'
		);

		expect( __unstableGetSelect ).toHaveBeenCalledWith( 'core' );
		expect( getMenuItem ).toHaveBeenCalledWith( '123' );
	} );
} );
