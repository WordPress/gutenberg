import { describe, expect, it } from 'vitest';
import engine from '../lib/engine';

describe( 'Engine', () => {
	it( 'should return a void IR for undefined code', () => {
		const { ir } = engine( undefined );
		expect( ir ).toHaveLength( 0 );
	} );
} );
