/**
 * Internal dependencies
 */
import {
	partitionAttributesByGroups,
	mergeStyleByGroups,
	findDescendantsOfType,
} from '../sibling-style-sync-utils';

describe( 'partitionAttributesByGroups', () => {
	it( 'splits top-level and style sub-key attributes by sync group', () => {
		const { syncedAttributes, unsyncedAttributes } =
			partitionAttributesByGroups(
				{ textColor: 'vivid-red', content: 'hello' },
				[ 'color' ]
			);

		expect( syncedAttributes ).toEqual( { textColor: 'vivid-red' } );
		expect( unsyncedAttributes ).toEqual( { content: 'hello' } );
	} );

	it( 'splits style sub-keys between synced and unsynced', () => {
		const attrs = {
			style: {
				color: { text: '#f00' },
				spacing: { padding: '1em' },
				typography: { fontSize: '1rem' },
			},
		};
		const { syncedAttributes, unsyncedAttributes } =
			partitionAttributesByGroups( attrs, [ 'color' ] );

		expect( syncedAttributes ).toEqual( {
			style: { color: { text: '#f00' } },
		} );
		expect( unsyncedAttributes ).toEqual( {
			style: {
				spacing: { padding: '1em' },
				typography: { fontSize: '1rem' },
			},
		} );
	} );

	it( 'handles multiple groups', () => {
		const { syncedAttributes } = partitionAttributesByGroups(
			{
				textColor: 'vivid-red',
				fontSize: 'large',
				borderColor: 'black',
				content: 'hello',
			},
			[ 'color', 'typography', 'border' ]
		);

		expect( syncedAttributes ).toEqual( {
			textColor: 'vivid-red',
			fontSize: 'large',
			borderColor: 'black',
		} );
	} );

	it( 'omits the style key entirely when all its sub-keys fall in one bucket', () => {
		const allUnsynced = { style: { spacing: { padding: '1em' } } };
		expect(
			partitionAttributesByGroups( allUnsynced, [ 'color' ] )
				.syncedAttributes.style
		).toBeUndefined();

		const allSynced = { style: { color: { text: '#f00' } } };
		expect(
			partitionAttributesByGroups( allSynced, [ 'color' ] )
				.unsyncedAttributes.style
		).toBeUndefined();
	} );
} );

describe( 'mergeStyleByGroups', () => {
	it( 'overwrites synced sub-keys and preserves unsynced ones', () => {
		const current = {
			color: { text: '#000' },
			spacing: { padding: '1em' },
		};
		const incoming = { color: { text: '#f00' } };

		const result = mergeStyleByGroups( current, incoming, [ 'color' ] );

		expect( result ).toEqual( {
			color: { text: '#f00' },
			spacing: { padding: '1em' },
		} );
	} );

	it( 'ignores incoming sub-keys that are not in the declared groups', () => {
		const current = { spacing: { padding: '1em' } };
		const incoming = { typography: { fontSize: '2rem' } };

		const result = mergeStyleByGroups( current, incoming, [ 'color' ] );

		expect( result ).toEqual( { spacing: { padding: '1em' } } );
	} );
} );

describe( 'findDescendantsOfType', () => {
	it( 'finds nested descendants two levels deep', () => {
		const heading = {
			name: 'core/accordion-heading',
			clientId: 'ah1',
			innerBlocks: [],
		};
		const blocks = [
			{
				name: 'core/accordion-item',
				clientId: 'ai1',
				innerBlocks: [ heading ],
			},
		];

		expect(
			findDescendantsOfType( blocks, 'core/accordion-heading' )
		).toEqual( [ heading ] );
	} );

	it( 'collects matching descendants across multiple siblings', () => {
		const h1 = {
			name: 'core/accordion-heading',
			clientId: 'ah1',
			innerBlocks: [],
		};
		const h2 = {
			name: 'core/accordion-heading',
			clientId: 'ah2',
			innerBlocks: [],
		};
		const blocks = [
			{
				name: 'core/accordion-item',
				clientId: 'ai1',
				innerBlocks: [ h1 ],
			},
			{
				name: 'core/accordion-item',
				clientId: 'ai2',
				innerBlocks: [ h2 ],
			},
		];

		expect(
			findDescendantsOfType( blocks, 'core/accordion-heading' )
		).toEqual( [ h1, h2 ] );
	} );

	it( 'returns an empty array when no blocks match', () => {
		const blocks = [
			{ name: 'core/paragraph', clientId: 'p1', innerBlocks: [] },
		];
		expect( findDescendantsOfType( blocks, 'core/heading' ) ).toEqual( [] );
	} );
} );
