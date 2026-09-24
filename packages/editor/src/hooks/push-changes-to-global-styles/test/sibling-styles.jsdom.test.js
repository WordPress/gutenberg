import { describe, expect, it } from 'vitest';
import { getChangesToPush } from '../index';
import {
	getSiblingCurrentValue,
	getSiblingStylesUpdate,
	isEqualStyleValue,
} from '../sibling-styles';

describe( 'getSiblingStylesUpdate', () => {
	it( 'returns null when there are no rows or no siblings', () => {
		const attributes = { style: { color: { text: '#c00' } } };
		const rows = getChangesToPush( [ 'color' ], attributes, undefined );
		const siblings = [ { clientId: 'a', attributes: {} } ];

		expect(
			getSiblingStylesUpdate( { rowsToApply: [], attributes, siblings } )
		).toBeNull();
		expect(
			getSiblingStylesUpdate( {
				rowsToApply: rows,
				attributes,
				siblings: [],
			} )
		).toBeNull();
	} );

	it( 'copies a custom value to every sibling, keyed by clientId', () => {
		const attributes = { style: { color: { text: '#c00' } } };
		const rows = getChangesToPush( [ 'color' ], attributes, undefined );
		const siblings = [
			{ clientId: 'a', attributes: {} },
			{ clientId: 'b', attributes: {} },
		];

		const updates = getSiblingStylesUpdate( {
			rowsToApply: rows,
			attributes,
			siblings,
		} );

		expect( Object.keys( updates ) ).toEqual( [ 'a', 'b' ] );
		expect( updates.a.style.color.text ).toBe( '#c00' );
		expect( updates.b.style.color.text ).toBe( '#c00' );
	} );

	it( "merges into each sibling's own styles rather than replacing them", () => {
		const attributes = { style: { color: { text: '#c00' } } };
		const rows = getChangesToPush( [ 'color' ], attributes, undefined );
		const siblings = [
			{
				clientId: 'a',
				attributes: { style: { spacing: { padding: '2rem' } } },
			},
		];

		const updates = getSiblingStylesUpdate( {
			rowsToApply: rows,
			attributes,
			siblings,
		} );

		// The padding the sibling already had survives the copy.
		expect( updates.a.style ).toEqual( {
			spacing: { padding: '2rem' },
			color: { text: '#c00' },
		} );
	} );

	it( 'carries a preset in its block attribute and clears the competing custom value', () => {
		const attributes = { textColor: 'vivid-red' };
		const rows = getChangesToPush( [ 'color' ], attributes, undefined );
		const siblings = [
			{
				clientId: 'a',
				attributes: { style: { color: { text: '#000' } } },
			},
		];

		const updates = getSiblingStylesUpdate( {
			rowsToApply: rows,
			attributes,
			siblings,
		} );

		expect( updates.a.textColor ).toBe( 'vivid-red' );
		// The sibling's own custom colour is cleared so it can't win over the
		// preset that was just copied across.
		expect( updates.a.style?.color?.text ).toBeUndefined();
	} );

	it( 'copies a preset that has no block attribute to carry it', () => {
		const applyTo = ( supports, attributes, siblingAttributes ) =>
			getSiblingStylesUpdate( {
				rowsToApply: getChangesToPush(
					supports,
					attributes,
					undefined
				),
				attributes,
				siblings: [ { clientId: 'a', attributes: siblingAttributes } ],
			} );

		// A spacing size lives in `style`. Clearing it instead of copying it
		// left the sibling with no gap at all, since nothing else in the row
		// counted as a change.
		const gap = applyTo(
			[ 'blockGap' ],
			{ style: { spacing: { blockGap: 'var:preset|spacing|40' } } },
			{ style: { spacing: { blockGap: '1rem' } } }
		);
		expect( gap.a.style.spacing.blockGap ).toBe( 'var:preset|spacing|40' );

		// So does a per-side border colour.
		const side = applyTo(
			[ 'borderColor' ],
			{
				style: {
					border: { top: { color: 'var:preset|color|vivid-red' } },
				},
			},
			{}
		);
		expect( side.a.style.border.top.color ).toBe(
			'var:preset|color|vivid-red'
		);

		// A flat border colour is the opposite case: `borderColor` carries it,
		// so it travels as that attribute and is kept out of `style`, where it
		// would otherwise be duplicated onto all four sides.
		const flat = applyTo(
			[ 'borderColor' ],
			{ borderColor: 'vivid-red' },
			{}
		);
		expect( flat.a.borderColor ).toBe( 'vivid-red' );
		expect( flat.a.style?.border?.color ).toBeUndefined();
		expect( flat.a.style?.border?.top?.color ).toBeUndefined();
	} );

	it( "clears a sibling's preset attribute that would win over a custom value", () => {
		const attributes = { style: { color: { text: '#c00' } } };
		const rows = getChangesToPush( [ 'color' ], attributes, undefined );
		const siblings = [
			{ clientId: 'a', attributes: { textColor: 'vivid-red' } },
		];

		const updates = getSiblingStylesUpdate( {
			rowsToApply: rows,
			attributes,
			siblings,
		} );

		expect( updates.a.style.color.text ).toBe( '#c00' );
		// The preset class would otherwise stay on the sibling alongside the
		// custom colour that was just copied.
		expect( updates.a ).toHaveProperty( 'textColor', undefined );
	} );

	it( 'only applies the rows it is given', () => {
		const attributes = {
			style: {
				color: { text: '#c00' },
				spacing: { padding: '2rem' },
			},
		};
		const rows = getChangesToPush(
			[ 'color', 'padding' ],
			attributes,
			undefined
		);
		const colorRow = rows.find( ( row ) => row.id === 'color.text' );
		const siblings = [ { clientId: 'a', attributes: {} } ];

		const updates = getSiblingStylesUpdate( {
			rowsToApply: [ colorRow ],
			attributes,
			siblings,
		} );

		expect( updates.a.style.color.text ).toBe( '#c00' );
		// Padding wasn't chosen, so the sibling doesn't get it.
		expect( updates.a.style.spacing ).toBeUndefined();
	} );
} );

describe( 'getSiblingCurrentValue', () => {
	const attributes = { style: { color: { text: '#c00' } } };
	const [ colorRow ] = getChangesToPush( [ 'color' ], attributes, undefined );

	it( 'reports the shared value when the siblings agree', () => {
		const siblings = [
			{
				clientId: 'a',
				attributes: { style: { color: { text: '#111' } } },
			},
			{
				clientId: 'b',
				attributes: { style: { color: { text: '#111' } } },
			},
		];

		expect( getSiblingCurrentValue( colorRow, siblings ) ).toEqual( {
			value: '#111',
			varies: false,
		} );
	} );

	it( 'reports that the value varies when the siblings disagree', () => {
		const siblings = [
			{
				clientId: 'a',
				attributes: { style: { color: { text: '#111' } } },
			},
			{
				clientId: 'b',
				attributes: { style: { color: { text: '#222' } } },
			},
		];

		expect( getSiblingCurrentValue( colorRow, siblings ) ).toEqual( {
			value: undefined,
			varies: true,
		} );
	} );

	it( 'reads a preset attribute in its user form', () => {
		const siblings = [
			{ clientId: 'a', attributes: { textColor: 'vivid-red' } },
			{ clientId: 'b', attributes: { textColor: 'vivid-red' } },
		];

		expect( getSiblingCurrentValue( colorRow, siblings ) ).toEqual( {
			value: 'var:preset|color|vivid-red',
			varies: false,
		} );
	} );

	it( 'handles having no siblings', () => {
		expect( getSiblingCurrentValue( colorRow, [] ) ).toEqual( {
			value: undefined,
			varies: false,
		} );
	} );
} );

describe( 'isEqualStyleValue', () => {
	it( 'compares nested style objects by value', () => {
		expect(
			isEqualStyleValue(
				{ top: '1rem', left: '2rem' },
				{ top: '1rem', left: '2rem' }
			)
		).toBe( true );
		expect(
			isEqualStyleValue( { top: '1rem' }, { top: '1rem', left: '2rem' } )
		).toBe( false );
		expect( isEqualStyleValue( '1rem', '1rem' ) ).toBe( true );
		expect( isEqualStyleValue( undefined, undefined ) ).toBe( true );
		expect( isEqualStyleValue( undefined, '1rem' ) ).toBe( false );
	} );
} );
