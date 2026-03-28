/**
 * Internal dependencies
 */
import {
	partitionAttributesByGroups,
	mergeStyleByGroups,
	findDescendantsOfType,
} from '../sibling-style-sync-utils';

describe( 'partitionAttributesByGroups', () => {
	it( 'syncs known style top-level attributes and leaves content attributes unsynced', () => {
		const { syncedAttributes, unsyncedAttributes } =
			partitionAttributesByGroups( {
				textColor: 'vivid-red',
				content: 'hello',
			} );

		expect( syncedAttributes ).toEqual( { textColor: 'vivid-red' } );
		expect( unsyncedAttributes ).toEqual( { content: 'hello' } );
	} );

	it( 'syncs all known style sub-keys and leaves unknown sub-keys unsynced', () => {
		const attrs = {
			style: {
				color: { text: '#f00' },
				spacing: { padding: '1em' },
				typography: { fontSize: '1rem' },
				dimensions: { minHeight: '100px' },
			},
		};
		const { syncedAttributes, unsyncedAttributes } =
			partitionAttributesByGroups( attrs );

		expect( syncedAttributes ).toEqual( {
			style: {
				color: { text: '#f00' },
				spacing: { padding: '1em' },
				typography: { fontSize: '1rem' },
			},
		} );
		expect( unsyncedAttributes ).toEqual( {
			style: { dimensions: { minHeight: '100px' } },
		} );
	} );

	it( 'syncs all known style top-level attributes', () => {
		const { syncedAttributes } = partitionAttributesByGroups( {
			textColor: 'vivid-red',
			fontSize: 'large',
			borderColor: 'black',
			backgroundColor: 'white',
			gradient: 'vivid-cyan-blue-to-vivid-purple',
			fontFamily: 'sans-serif',
			content: 'hello',
		} );

		expect( syncedAttributes ).toEqual( {
			textColor: 'vivid-red',
			fontSize: 'large',
			borderColor: 'black',
			backgroundColor: 'white',
			gradient: 'vivid-cyan-blue-to-vivid-purple',
			fontFamily: 'sans-serif',
		} );
	} );

	it( 'omits the style key entirely when all its sub-keys are unsynced', () => {
		const { syncedAttributes } = partitionAttributesByGroups( {
			style: { dimensions: { minHeight: '100px' } },
		} );
		expect( syncedAttributes.style ).toBeUndefined();
	} );
} );

describe( 'mergeStyleByGroups', () => {
	it( 'overwrites known synced sub-keys and preserves others', () => {
		const current = {
			color: { text: '#000' },
			spacing: { padding: '1em' },
		};
		const incoming = { color: { text: '#f00' } };

		const result = mergeStyleByGroups( current, incoming );

		expect( result ).toEqual( {
			color: { text: '#f00' },
			spacing: { padding: '1em' },
		} );
	} );

	it( 'merges multiple known style sub-keys', () => {
		const current = {
			color: { text: '#000' },
			spacing: { padding: '1em' },
		};
		const incoming = {
			color: { text: '#f00' },
			typography: { fontSize: '2rem' },
		};

		const result = mergeStyleByGroups( current, incoming );

		expect( result ).toEqual( {
			color: { text: '#f00' },
			spacing: { padding: '1em' },
			typography: { fontSize: '2rem' },
		} );
	} );

	it( 'ignores incoming unknown sub-keys', () => {
		const current = { spacing: { padding: '1em' } };
		const incoming = { dimensions: { minHeight: '100px' } };

		const result = mergeStyleByGroups( current, incoming );

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
