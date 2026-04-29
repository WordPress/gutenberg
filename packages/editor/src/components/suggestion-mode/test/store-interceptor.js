/**
 * Internal dependencies
 */
import { diffAttributes, shallowAttributeEquals } from '../store-interceptor';

describe( 'shallowAttributeEquals', () => {
	it( 'treats reference-equal values as equal', () => {
		const obj = { a: 1 };
		expect( shallowAttributeEquals( obj, obj ) ).toBe( true );
	} );

	it( 'returns true for primitives that match', () => {
		expect( shallowAttributeEquals( 1, 1 ) ).toBe( true );
		expect( shallowAttributeEquals( 'a', 'a' ) ).toBe( true );
	} );

	it( 'returns false when only one side is null/undefined', () => {
		expect( shallowAttributeEquals( null, {} ) ).toBe( false );
		expect( shallowAttributeEquals( undefined, '' ) ).toBe( false );
	} );

	it( 'compares plain objects by structure', () => {
		expect( shallowAttributeEquals( { a: 1, b: 2 }, { a: 1, b: 2 } ) ).toBe(
			true
		);
	} );
} );

describe( 'diffAttributes', () => {
	it( 'returns null when attributes are unchanged', () => {
		expect(
			diffAttributes( { content: 'a' }, { content: 'a' } )
		).toBeNull();
	} );

	it( 'detects changed values and emits matching restore', () => {
		expect( diffAttributes( { level: 2 }, { level: 3 } ) ).toEqual( {
			changed: { level: 3 },
			restore: { level: 2 },
		} );
	} );

	it( 'detects added keys (no previous value to restore)', () => {
		expect( diffAttributes( {}, { url: 'https://example.test' } ) ).toEqual(
			{
				changed: { url: 'https://example.test' },
				restore: { url: undefined },
			}
		);
	} );

	it( 'detects removed keys and includes them in restore', () => {
		expect( diffAttributes( { align: 'center' }, {} ) ).toEqual( {
			changed: { align: undefined },
			restore: { align: 'center' },
		} );
	} );

	it( 'collects multiple changes in one delta', () => {
		const delta = diffAttributes(
			{ level: 2, content: 'Hi' },
			{ level: 3, content: 'Hi' }
		);
		expect( delta ).toEqual( {
			changed: { level: 3 },
			restore: { level: 2 },
		} );
	} );
} );
