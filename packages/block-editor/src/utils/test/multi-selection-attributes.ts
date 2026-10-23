import { describe, expect, it } from 'vitest';
import {
	getAttributeChanges,
	applyAttributeChanges,
} from '../multi-selection-attributes';

describe( 'getAttributeChanges', () => {
	it( 'returns undefined for an empty update', () => {
		expect( getAttributeChanges( { content: 'a' }, {} ) ).toBeUndefined();
	} );

	it( 'returns undefined when the update repeats the values the block has', () => {
		expect(
			getAttributeChanges(
				{ content: 'a', fontSize: 'large' },
				{ fontSize: 'large' }
			)
		).toBeUndefined();
	} );

	it( 'returns undefined when an object attribute is repeated in a new object', () => {
		expect(
			getAttributeChanges(
				{ style: { color: { text: 'red' } } },
				// A new object holding the values the block already has.
				{ style: { color: { text: 'red' } } }
			)
		).toBeUndefined();
	} );

	it( 'leaves out attributes the update does not mention', () => {
		expect(
			getAttributeChanges(
				{ content: 'a', textColor: 'white' },
				{ textColor: 'black' }
			)
		).toStrictEqual( { textColor: 'black' } );
	} );

	it( 'records a removed attribute as undefined', () => {
		expect(
			getAttributeChanges(
				{ fontSize: 'large' },
				{ fontSize: undefined }
			)
		).toStrictEqual( { fontSize: undefined } );
	} );

	it( 'records an array as a whole', () => {
		expect(
			getAttributeChanges( { values: [ 'a', 'b' ] }, { values: [ 'c' ] } )
		).toEqual( { values: [ 'c' ] } );
	} );

	it( 'records only the changed value within an object attribute', () => {
		expect(
			getAttributeChanges(
				{ style: { color: { background: 'red' } } },
				{ style: { color: { background: 'red', text: 'white' } } }
			)
		).toEqual( { style: { color: { text: 'white' } } } );
	} );

	it( 'records a value removed from within an object attribute', () => {
		expect(
			getAttributeChanges(
				{
					style: {
						typography: { fontSize: '20px', lineHeight: '1.5' },
					},
				},
				{ style: { typography: { lineHeight: '1.5' } } }
			)
		).toStrictEqual( {
			style: { typography: { fontSize: undefined } },
		} );
	} );

	it( 'records every value of an object attribute the block does not have', () => {
		expect(
			getAttributeChanges(
				{},
				{ style: { typography: { fontSize: '20px' } } }
			)
		).toEqual( { style: { typography: { fontSize: '20px' } } } );
	} );

	it( 'records the removal of each value of a cleared object attribute', () => {
		expect(
			getAttributeChanges(
				{
					style: {
						typography: { fontSize: '20px' },
						color: { text: 'red' },
					},
				},
				{ style: undefined }
			)
		).toStrictEqual( {
			style: {
				typography: { fontSize: undefined },
				color: { text: undefined },
			},
		} );
	} );

	it( 'records the removal of each value of an object nested within an attribute', () => {
		expect(
			getAttributeChanges(
				{
					style: {
						border: {
							top: '5px',
							left: { min: '5px', max: '10px' },
						},
					},
				},
				{ style: { border: { top: '5px' } } }
			)
		).toStrictEqual( {
			style: { border: { left: { min: undefined, max: undefined } } },
		} );
	} );

	it( 'records a shorthand that replaces an object, rather than the removal of the values it held', () => {
		expect(
			getAttributeChanges(
				{
					style: {
						border: {
							top: '5px',
							left: '5px',
							right: '5px',
							bottom: '10px',
						},
					},
				},
				{ style: { border: '5px' } }
			)
		).toEqual( { style: { border: '5px' } } );
	} );
} );

describe( 'applyAttributeChanges', () => {
	it( 'returns an empty update for changes that hold nothing', () => {
		expect( applyAttributeChanges( { content: 'a' }, {} ) ).toStrictEqual(
			{}
		);
	} );

	it( 'replaces an attribute the block already has', () => {
		expect(
			applyAttributeChanges(
				{ content: 'a', align: 'left' },
				{ align: 'center' }
			)
		).toStrictEqual( { align: 'center' } );
	} );

	it( 'clears an attribute the block has', () => {
		expect(
			applyAttributeChanges(
				{ fontSize: 'small' },
				{ fontSize: undefined }
			)
		).toStrictEqual( { fontSize: undefined } );
	} );

	it( 'leaves out attributes the changes do not mention', () => {
		expect(
			applyAttributeChanges(
				{ content: 'b', textColor: 'white' },
				{ textColor: 'black' }
			)
		).toStrictEqual( { textColor: 'black' } );
	} );

	it( 'merges a change into an object attribute, keeping the values it does not mention', () => {
		expect(
			applyAttributeChanges(
				{ style: { color: { background: 'green' } } },
				{ style: { color: { text: 'white' } } }
			)
		).toEqual( {
			style: { color: { background: 'green', text: 'white' } },
		} );
	} );

	it( 'merges an object attribute into a block that does not have one', () => {
		expect(
			applyAttributeChanges(
				{},
				{ style: { typography: { fontSize: '20px' } } }
			)
		).toEqual( { style: { typography: { fontSize: '20px' } } } );
	} );

	it( 'drops a branch the changes empty out', () => {
		expect(
			applyAttributeChanges(
				{
					style: {
						typography: { fontSize: '16px' },
						color: { text: 'red' },
					},
				},
				{ style: { typography: { fontSize: undefined } } }
			)
		).toEqual( { style: { color: { text: 'red' } } } );
	} );

	it( 'clears an attribute once every value it held is removed', () => {
		expect(
			applyAttributeChanges(
				{ style: { typography: { fontSize: '20px' } } },
				{ style: { typography: { fontSize: undefined } } }
			)
		).toStrictEqual( { style: undefined } );
	} );

	it( 'replaces the per-side values a block holds with a shorthand', () => {
		expect(
			applyAttributeChanges(
				{ style: { border: { top: '2px', bottom: '8px' } } },
				{ style: { border: '5px' } }
			)
		).toEqual( { style: { border: '5px' } } );
	} );

	it( 'keeps the branches a removal does not mention', () => {
		expect(
			applyAttributeChanges(
				{ style: { color: { text: 'red' } } },
				{ style: { typography: { fontSize: undefined } } }
			)
		).toEqual( { style: { color: { text: 'red' } } } );
	} );
} );
