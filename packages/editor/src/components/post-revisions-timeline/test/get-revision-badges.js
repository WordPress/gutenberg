import { addFilter, removeFilter } from '@wordpress/hooks';
import getRevisionBadges, {
	REVISION_BADGES_FILTER,
} from '../get-revision-badges';

describe( 'getRevisionBadges', () => {
	afterEach( () => {
		removeFilter( REVISION_BADGES_FILTER, 'test/public' );
		removeFilter( REVISION_BADGES_FILTER, 'test/throwing' );
		removeFilter( REVISION_BADGES_FILTER, 'test/malformed' );
		removeFilter( REVISION_BADGES_FILTER, 'test/function-label' );
		removeFilter( REVISION_BADGES_FILTER, 'test/hide-autosave' );
	} );

	it( 'labels an autosave revision', () => {
		expect( getRevisionBadges( { slug: '10-autosave-v1' } ) ).toEqual( [
			{ id: 'core/autosave', label: 'Autosave', intent: 'none' },
		] );
	} );

	it( 'returns no badges for a regular revision', () => {
		expect( getRevisionBadges( { slug: '10-revision-v1' } ) ).toEqual( [] );
	} );

	it( 'includes a matching plugin badge', () => {
		addFilter( REVISION_BADGES_FILTER, 'test/public', ( badges ) => [
			...badges,
			{
				id: 'test/public',
				label: 'Public',
				intent: 'informational',
				isMatch: ( item ) => !! item.meta?.is_public,
			},
		] );

		expect(
			getRevisionBadges( {
				slug: '10-revision-v1',
				meta: { is_public: true },
			} )
		).toEqual( [
			{
				id: 'test/public',
				label: 'Public',
				intent: 'informational',
			},
		] );
	} );

	it( 'omits a non-matching plugin badge', () => {
		addFilter( REVISION_BADGES_FILTER, 'test/public', ( badges ) => [
			...badges,
			{
				id: 'test/public',
				label: 'Public',
				intent: 'informational',
				isMatch: ( item ) => !! item.meta?.is_public,
			},
		] );

		expect(
			getRevisionBadges( {
				slug: '10-revision-v1',
				meta: { is_public: false },
			} )
		).toEqual( [] );
	} );

	it( 'resolves a function label', () => {
		addFilter(
			REVISION_BADGES_FILTER,
			'test/function-label',
			( badges ) => [
				...badges,
				{
					id: 'test/version',
					label: ( item ) => `v${ item.meta.version }`,
					isMatch: ( item ) => !! item.meta?.version,
				},
			]
		);

		expect(
			getRevisionBadges( {
				slug: '10-revision-v1',
				meta: { version: 3 },
			} )
		).toEqual( [ { id: 'test/version', label: 'v3', intent: 'none' } ] );
	} );

	it( 'drops malformed descriptors', () => {
		addFilter( REVISION_BADGES_FILTER, 'test/malformed', ( badges ) => [
			...badges,
			{ id: 'test/missing-match', label: 'Broken' },
			{
				label: 'No id',
				isMatch: () => true,
			},
			null,
		] );

		expect( getRevisionBadges( { slug: '10-revision-v1' } ) ).toEqual( [] );
	} );

	it( 'treats a throwing isMatch as a miss', () => {
		addFilter( REVISION_BADGES_FILTER, 'test/throwing', ( badges ) => [
			...badges,
			{
				id: 'test/throwing',
				label: 'Broken',
				isMatch: () => {
					throw new Error( 'predicate failed' );
				},
			},
		] );

		expect( getRevisionBadges( { slug: '10-revision-v1' } ) ).toEqual( [] );
	} );

	it( 'allows plugins to remove the core autosave badge', () => {
		addFilter( REVISION_BADGES_FILTER, 'test/hide-autosave', ( badges ) =>
			badges.filter( ( badge ) => badge.id !== 'core/autosave' )
		);

		expect( getRevisionBadges( { slug: '10-autosave-v1' } ) ).toEqual( [] );
	} );
} );
