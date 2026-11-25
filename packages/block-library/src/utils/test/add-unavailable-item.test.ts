import { describe, expect, it } from 'vitest';
import { addUnavailableItem } from '../add-unavailable-item';

describe( 'addUnavailableItem', () => {
	const items = [
		{ label: 'Categories', value: 'category' },
		{ label: 'Tags', value: 'post_tag' },
	];

	it( 'returns no items while they load', () => {
		expect( addUnavailableItem( undefined, 'custom' ) ).toEqual( [] );
	} );

	it( 'returns the same items when they include the saved value', () => {
		expect( addUnavailableItem( items, 'post_tag' ) ).toBe( items );
	} );

	it.each( [ '', undefined ] )(
		'returns the same items when the saved value is %j',
		( savedValue ) => {
			expect( addUnavailableItem( items, savedValue ) ).toBe( items );
		}
	);

	it( 'adds a missing saved value as a disabled first item', () => {
		expect( addUnavailableItem( items, 'custom' ) ).toEqual( [
			{ label: 'custom (unavailable)', value: 'custom', disabled: true },
			...items,
		] );
		expect( items ).toHaveLength( 2 );
	} );
} );
