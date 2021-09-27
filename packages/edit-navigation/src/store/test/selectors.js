/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import {
	getNavigationPostForMenu,
	hasResolvedNavigationPost,
	getSelectedMenuId,
} from '../selectors';
import {
	NAVIGATION_POST_KIND,
	NAVIGATION_POST_POST_TYPE,
} from '../../constants';

import { buildNavigationPostId } from '../utils';

describe( 'getNavigationPostForMenu', () => {
	it( 'gets navigation post for menu', () => {
		const getEditedEntityRecord = jest.fn( () => 'record' );
		const hasFinishedResolution = jest.fn( () => true );
		const registry = {
			select: jest.fn( () => ( {
				getEditedEntityRecord,
				hasFinishedResolution,
			} ) ),
		};

		const menuId = 123;

		const defaultRegistry = getNavigationPostForMenu.registry;
		getNavigationPostForMenu.registry = registry;
		hasResolvedNavigationPost.registry = registry;

		expect( getNavigationPostForMenu( 'state', menuId ) ).toBe( 'record' );

		expect( registry.select ).toHaveBeenCalledWith( coreDataStore );
		expect( getEditedEntityRecord ).toHaveBeenCalledWith(
			NAVIGATION_POST_KIND,
			NAVIGATION_POST_POST_TYPE,
			buildNavigationPostId( menuId )
		);

		getNavigationPostForMenu.registry = defaultRegistry;
		hasResolvedNavigationPost.registry = defaultRegistry;
	} );

	it( 'returns null if has not resolved navigation post yet', () => {
		const getEditedEntityRecord = jest.fn( () => 'record' );
		const hasFinishedResolution = jest.fn( () => false );
		const registry = {
			select: jest.fn( () => ( {
				getEditedEntityRecord,
				hasFinishedResolution,
			} ) ),
		};

		const menuId = 123;

		const defaultRegistry = getNavigationPostForMenu.registry;
		getNavigationPostForMenu.registry = registry;
		hasResolvedNavigationPost.registry = registry;

		expect( getNavigationPostForMenu( 'state', menuId ) ).toBe( null );

		expect( registry.select ).toHaveBeenCalledWith( coreDataStore );
		expect( getEditedEntityRecord ).not.toHaveBeenCalled();

		getNavigationPostForMenu.registry = defaultRegistry;
		hasResolvedNavigationPost.registry = defaultRegistry;
	} );
} );

describe( 'hasResolvedNavigationPost', () => {
	it( 'returns if it has resolved navigation post yet', () => {
		const hasFinishedResolution = jest.fn( () => true );
		const registry = {
			select: jest.fn( () => ( {
				hasFinishedResolution,
			} ) ),
		};

		const menuId = 123;

		const defaultRegistry = getNavigationPostForMenu.registry;
		hasResolvedNavigationPost.registry = registry;

		expect( hasResolvedNavigationPost( 'state', menuId ) ).toBe( true );

		expect( registry.select ).toHaveBeenCalledWith( coreDataStore );
		expect( hasFinishedResolution ).toHaveBeenCalledWith(
			'getEntityRecord',
			[
				NAVIGATION_POST_KIND,
				NAVIGATION_POST_POST_TYPE,
				buildNavigationPostId( menuId ),
			]
		);

		hasResolvedNavigationPost.registry = defaultRegistry;
	} );
} );

describe( 'getSelectedMenuId', () => {
	it( 'returns default selected menu ID (zero)', () => {
		const state = {};
		expect( getSelectedMenuId( state ) ).toBe( null );
	} );

	it( 'returns selected menu ID', () => {
		const state = { selectedMenuId: 10 };
		expect( getSelectedMenuId( state ) ).toBe( 10 );
	} );
} );
