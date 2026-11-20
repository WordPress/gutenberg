import { describe, expect, it } from 'vitest';
import { isCollapsed } from '../is-collapsed';
import { partialValue } from './helpers';

describe( 'isCollapsed', () => {
	it( 'should return true for a collapsed selection', () => {
		const record = partialValue( {
			start: 4,
			end: 4,
		} );

		expect( isCollapsed( record ) ).toBe( true );
	} );
} );
