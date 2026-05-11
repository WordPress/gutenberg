/**
 * Internal dependencies
 */
import { preserveClientIds } from '../preserve-client-ids';

describe( 'preserveClientIds', () => {
	it( 'should return newBlocks when prevBlocks is empty', () => {
		const newBlocks = [
			{ name: 'core/paragraph', clientId: 'new-1', attributes: {} },
		];
		expect( preserveClientIds( newBlocks, [] ) ).toBe( newBlocks );
		expect( preserveClientIds( newBlocks, null ) ).toBe( newBlocks );
		expect( preserveClientIds( newBlocks, undefined ) ).toBe( newBlocks );
	} );

	it( 'should return newBlocks when newBlocks is empty', () => {
		const prevBlocks = [
			{ name: 'core/paragraph', clientId: 'prev-1', attributes: {} },
		];
		expect( preserveClientIds( [], prevBlocks ) ).toEqual( [] );
		expect( preserveClientIds( null, prevBlocks ) ).toBe( null );
		expect( preserveClientIds( undefined, prevBlocks ) ).toBe( undefined );
	} );

	it( 'should preserve clientIds for identical blocks', () => {
		const prevBlocks = [
			{
				name: 'core/paragraph',
				clientId: 'prev-1',
				attributes: { content: 'Hello' },
				originalContent: 'Hello',
				innerBlocks: [],
			},
			{
				name: 'core/heading',
				clientId: 'prev-2',
				attributes: { level: 2 },
				originalContent: 'Title',
				innerBlocks: [],
			},
		];
		const newBlocks = [
			{
				name: 'core/paragraph',
				clientId: 'new-1',
				attributes: { content: 'Hello' },
				originalContent: 'Hello',
				innerBlocks: [],
			},
			{
				name: 'core/heading',
				clientId: 'new-2',
				attributes: { level: 2 },
				originalContent: 'Title',
				innerBlocks: [],
			},
		];

		const result = preserveClientIds( newBlocks, prevBlocks );

		expect( result[ 0 ].clientId ).toBe( 'prev-1' );
		expect( result[ 1 ].clientId ).toBe( 'prev-2' );
	} );

	it( 'should keep new clientIds for added blocks', () => {
		const prevBlocks = [
			{
				name: 'core/paragraph',
				clientId: 'prev-1',
				attributes: { content: 'First' },
				originalContent: 'First',
				innerBlocks: [],
			},
		];
		const newBlocks = [
			{
				name: 'core/paragraph',
				clientId: 'new-1',
				attributes: { content: 'First' },
				originalContent: 'First',
				innerBlocks: [],
			},
			{
				name: 'core/paragraph',
				clientId: 'new-2',
				attributes: { content: 'Second' },
				originalContent: 'Second',
				innerBlocks: [],
			},
		];

		const result = preserveClientIds( newBlocks, prevBlocks );

		expect( result[ 0 ].clientId ).toBe( 'prev-1' );
		expect( result[ 1 ].clientId ).toBe( 'new-2' );
	} );

	it( 'should handle removed blocks', () => {
		const prevBlocks = [
			{
				name: 'core/paragraph',
				clientId: 'prev-1',
				attributes: { content: 'First' },
				originalContent: 'First',
				innerBlocks: [],
			},
			{
				name: 'core/paragraph',
				clientId: 'prev-2',
				attributes: { content: 'Second' },
				originalContent: 'Second',
				innerBlocks: [],
			},
		];
		const newBlocks = [
			{
				name: 'core/paragraph',
				clientId: 'new-2',
				attributes: { content: 'Second' },
				originalContent: 'Second',
				innerBlocks: [],
			},
		];

		const result = preserveClientIds( newBlocks, prevBlocks );

		expect( result ).toHaveLength( 1 );
		// Matches by name only, so first paragraph matches first paragraph.
		expect( result[ 0 ].clientId ).toBe( 'prev-1' );
	} );

	it( 'should preserve clientIds for inner blocks recursively', () => {
		const prevBlocks = [
			{
				name: 'core/group',
				clientId: 'prev-group',
				attributes: {},
				originalContent: '',
				innerBlocks: [
					{
						name: 'core/paragraph',
						clientId: 'prev-inner-1',
						attributes: { content: 'Inner' },
						originalContent: 'Inner',
						innerBlocks: [],
					},
				],
			},
		];
		const newBlocks = [
			{
				name: 'core/group',
				clientId: 'new-group',
				attributes: {},
				originalContent: '',
				innerBlocks: [
					{
						name: 'core/paragraph',
						clientId: 'new-inner-1',
						attributes: { content: 'Inner' },
						originalContent: 'Inner',
						innerBlocks: [],
					},
				],
			},
		];

		const result = preserveClientIds( newBlocks, prevBlocks );

		expect( result[ 0 ].clientId ).toBe( 'prev-group' );
		expect( result[ 0 ].innerBlocks[ 0 ].clientId ).toBe( 'prev-inner-1' );
	} );

	it( 'should preserve clientId even when attributes differ (matches by name only)', () => {
		const prevBlocks = [
			{
				name: 'core/paragraph',
				clientId: 'prev-1',
				attributes: { content: 'Old content' },
				originalContent: 'Old content',
				innerBlocks: [],
			},
		];
		const newBlocks = [
			{
				name: 'core/paragraph',
				clientId: 'new-1',
				attributes: { content: 'New content' },
				originalContent: 'New content',
				innerBlocks: [],
			},
		];

		const result = preserveClientIds( newBlocks, prevBlocks );

		expect( result[ 0 ].clientId ).toBe( 'prev-1' );
	} );

	it( 'should handle blocks with same name but different content using LCS', () => {
		const prevBlocks = [
			{
				name: 'core/paragraph',
				clientId: 'prev-a',
				attributes: { content: 'A' },
				originalContent: 'A',
				innerBlocks: [],
			},
			{
				name: 'core/paragraph',
				clientId: 'prev-b',
				attributes: { content: 'B' },
				originalContent: 'B',
				innerBlocks: [],
			},
			{
				name: 'core/paragraph',
				clientId: 'prev-c',
				attributes: { content: 'C' },
				originalContent: 'C',
				innerBlocks: [],
			},
		];
		const newBlocks = [
			{
				name: 'core/paragraph',
				clientId: 'new-a',
				attributes: { content: 'A' },
				originalContent: 'A',
				innerBlocks: [],
			},
			{
				name: 'core/paragraph',
				clientId: 'new-c',
				attributes: { content: 'C' },
				originalContent: 'C',
				innerBlocks: [],
			},
		];

		const result = preserveClientIds( newBlocks, prevBlocks );

		// Matches by name only, so matches in order (first to first, second to second).
		expect( result[ 0 ].clientId ).toBe( 'prev-a' );
		expect( result[ 1 ].clientId ).toBe( 'prev-b' );
	} );
} );
