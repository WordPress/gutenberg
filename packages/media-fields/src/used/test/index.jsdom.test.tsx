import { describe, expect, it } from 'vitest';
import usedField from '..';
import type { MediaItem } from '../../types';

describe( 'usedField', () => {
	it( 'reads the `used` property from the item', () => {
		expect(
			usedField.getValue?.( { item: { used: true } as MediaItem } )
		).toBe( true );
		expect(
			usedField.getValue?.( { item: { used: false } as MediaItem } )
		).toBe( false );
	} );

	it( 'exposes Used and Unused elements', () => {
		const elements = usedField.elements ?? [];

		expect( elements ).toEqual( [
			{ value: true, label: 'Used' },
			{ value: false, label: 'Unused' },
		] );
	} );

	it( 'is filterable by `is`, read-only, and not sortable', () => {
		expect( usedField.enableSorting ).toBe( false );
		expect( usedField.readOnly ).toBe( true );
		expect( usedField.filterBy ).toEqual( { operators: [ 'is' ] } );
	} );

	it( 'hides itself when the value was not requested', () => {
		expect(
			usedField.isVisible?.( { used: undefined } as MediaItem )
		).toBe( false );
		expect( usedField.isVisible?.( { used: null } as MediaItem ) ).toBe(
			false
		);
		expect( usedField.isVisible?.( { used: true } as MediaItem ) ).toBe(
			true
		);
	} );
} );
