import { describe, expect, it, vi } from 'vitest';
import {
	NO_LIMIT,
	parseCatalog,
	pinAction,
	project,
	resolveMatchFn,
	type Item,
	type ItemGroup,
	type MatchFn,
} from '../model';

const APPLE: Item = { value: 'apple', label: 'Apple' };
const APRICOT: Item = { value: 'apricot', label: 'Apricot' };
const BANANA: Item = { value: 'banana', label: 'Banana' };
const CREATE: Item = {
	value: '__create__',
	label: 'Create new item',
	creatable: true,
};

const alwaysMatch: MatchFn = () => true;

describe( 'parseCatalog', () => {
	it( 'returns an empty catalog when items are missing', () => {
		expect( parseCatalog( undefined ) ).toEqual( {
			shape: 'empty',
			results: [],
			action: undefined,
			creatableCount: 0,
		} );
	} );

	it( 'lifts the first creatable item out of a flat list and keeps its identity', () => {
		const extraCreate: Item = {
			value: '__create-extra__',
			label: 'Create extra',
			creatable: true,
		};
		const items = [ APPLE, CREATE, BANANA, extraCreate ];
		const catalog = parseCatalog( items );

		expect( catalog ).toEqual( {
			shape: 'flat',
			results: [ APPLE, BANANA ],
			action: CREATE,
			creatableCount: 2,
		} );
		expect( catalog.action ).toBe( CREATE );
	} );

	it( 'lifts a creatable item out of grouped items and keeps its identity', () => {
		const items: ItemGroup[] = [
			{ label: 'Common', items: [ APPLE, CREATE ] },
			{ label: 'Other', items: [ BANANA ] },
		];
		const catalog = parseCatalog( items );

		expect( catalog.shape ).toBe( 'grouped' );
		if ( catalog.shape !== 'grouped' ) {
			return;
		}

		expect( catalog.results ).toEqual( [
			{ label: 'Common', items: [ APPLE ] },
			{ label: 'Other', items: [ BANANA ] },
		] );
		expect( catalog.action ).toBe( CREATE );
		expect( catalog.actionGroupLabel ).toBe( '' );
		expect( catalog.creatableCount ).toBe( 1 );
	} );

	it( 'stores the first creatable-only group label', () => {
		const items: ItemGroup[] = [
			{ label: 'Common', items: [ APPLE ] },
			{ label: 'Actions', items: [ CREATE ] },
		];
		const catalog = parseCatalog( items );

		expect( catalog.shape ).toBe( 'grouped' );
		if ( catalog.shape !== 'grouped' ) {
			return;
		}

		expect( catalog.results ).toEqual( [
			{ label: 'Common', items: [ APPLE ] },
		] );
		expect( catalog.action ).toBe( CREATE );
		expect( catalog.actionGroupLabel ).toBe( 'Actions' );
	} );
} );

describe( 'project', () => {
	it( 'does not call the matcher on an empty query, including with limit', () => {
		const match = vi.fn( alwaysMatch );
		const catalog = parseCatalog( [ APPLE, APRICOT, BANANA, CREATE ] );

		const projection = project( {
			catalog,
			query: '   ',
			match,
			limit: 1,
		} );

		expect( match ).not.toHaveBeenCalled();
		expect( projection.filteredItems ).toEqual( [ APPLE, CREATE ] );
		expect( projection.action ).toBe( CREATE );
	} );

	it( 'pins the action after an unmatched query', () => {
		const catalog = parseCatalog( [ APPLE, CREATE ] );
		const projection = project( {
			catalog,
			query: 'xyzzy',
			match: ( item, query ) =>
				item.label.toLowerCase().includes( query ),
			limit: undefined,
		} );

		expect( projection.filteredItems ).toEqual( [ CREATE ] );
		expect( projection.action ).toBe( CREATE );
	} );

	it( 'counts only regular matches toward limit', () => {
		const catalog = parseCatalog( [ APPLE, APRICOT, BANANA, CREATE ] );
		const projection = project( {
			catalog,
			query: '',
			match: alwaysMatch,
			limit: 1,
		} );

		expect( projection.filteredItems ).toEqual( [ APPLE, CREATE ] );
	} );

	it( 'keeps all regulars when filter is null, then pins', () => {
		const catalog = parseCatalog( [ APPLE, BANANA, CREATE ] );
		const match = resolveMatchFn( null, () => false );
		const projection = project( {
			catalog,
			query: 'nope',
			match,
			limit: undefined,
		} );

		expect( projection.filteredItems ).toEqual( [ APPLE, BANANA, CREATE ] );
	} );

	it( 'composes consumer filteredItems by stripping creatable then pinning', () => {
		const match = vi.fn( alwaysMatch );
		const catalog = parseCatalog( [ APPLE, APRICOT, CREATE ] );
		const projection = project( {
			catalog,
			query: 'apricot',
			match,
			limit: 1,
			consumerFilteredItems: [ APRICOT, CREATE ],
		} );

		expect( match ).not.toHaveBeenCalled();
		expect( projection.filteredItems ).toEqual( [ APRICOT, CREATE ] );
		expect( projection.action ).toBe( CREATE );
	} );

	it( 'applies a running count across grouped results under limit', () => {
		const catalog = parseCatalog( [
			{
				label: 'Common',
				items: [ APPLE, APRICOT ],
			},
			{
				label: 'Other',
				items: [ BANANA, CREATE ],
			},
		] );
		const projection = project( {
			catalog,
			query: '',
			match: alwaysMatch,
			limit: 2,
		} );

		expect( projection.filteredItems ).toEqual( [
			{ label: 'Common', items: [ APPLE, APRICOT ] },
			{ label: '', items: [ CREATE ] },
		] );
	} );

	it( 'does not inject filteredItems when there is no action', () => {
		const catalog = parseCatalog( [ APPLE, BANANA ] );
		const projection = project( {
			catalog,
			query: 'apple',
			match: alwaysMatch,
			limit: 1,
		} );

		expect( projection ).toEqual( {
			items: [ APPLE, BANANA ],
			filteredItems: undefined,
			action: undefined,
		} );
	} );
} );

describe( 'pinAction', () => {
	it( 'appends the same action object last', () => {
		const catalog = parseCatalog( [ APPLE, CREATE ] );
		const pinned = pinAction( catalog, [ APPLE ] );

		expect( pinned ).toEqual( [ APPLE, CREATE ] );
		expect( ( pinned as Item[] )[ 1 ] ).toBe( CREATE );
	} );
} );

describe( 'resolveMatchFn', () => {
	it( 'uses the collator when filter is omitted', () => {
		const contains = vi.fn( () => true );
		const match = resolveMatchFn( undefined, contains );

		expect( match( APPLE, 'ap' ) ).toBe( true );
		expect( contains ).toHaveBeenCalledWith( APPLE, 'ap', undefined );
	} );
} );

describe( 'NO_LIMIT', () => {
	it( 'matches Base UI unlimited sentinel', () => {
		expect( NO_LIMIT ).toBe( -1 );
	} );
} );
