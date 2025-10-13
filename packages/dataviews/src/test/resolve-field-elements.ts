/**
 * Internal dependencies
 */
import resolveFieldElements from '../utils/resolve-field-elements';
import type { FieldElementsSource } from '../types';

const optionA = { value: 'a', label: 'A' };
const optionB = { value: 'b', label: 'B' };

describe( 'resolveFieldElements', () => {
	it( 'returns static arrays as-is', async () => {
		const source = [ optionA, optionB ];
		const result = await resolveFieldElements( source );
		expect( result ).toBe( source );
	} );

	it( 'resolves async function sources', async () => {
		const source = async () => [ optionA ];
		const result = await resolveFieldElements( source );
		expect( result ).toEqual( [ optionA ] );
	} );

	it( 'resolves async function sources with delay', async () => {
		const source = async () => {
			await Promise.resolve();
			return [ optionB ];
		};
		const result = await resolveFieldElements( source );
		expect( result ).toEqual( [ optionB ] );
	} );

	it( 'returns empty array when resolved value is not an array', async () => {
		const invalidSource = ( () =>
			Promise.resolve( null ) ) as unknown as FieldElementsSource;
		const result = await resolveFieldElements( invalidSource );
		expect( result ).toEqual( [] );
	} );

	it( 'propagates errors for callers to handle', async () => {
		const error = new Error( 'Failed' );
		const source = () => Promise.reject( error );

		await expect( resolveFieldElements( source ) ).rejects.toBe( error );
	} );
} );
