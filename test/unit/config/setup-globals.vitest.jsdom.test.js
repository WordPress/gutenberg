import { describe, expect, test, vi } from 'vitest';

globalThis.wpVitest.mockMatchMedia();

describe( 'wpVitest opt-in mocks', () => {
	test( 'installs a mock implementation', () => {
		expect( vi.isMockFunction( window.matchMedia ) ).toBe( true );
		expect( window.matchMedia( '(prefers-reduced-motion)' ).matches ).toBe(
			true
		);
	} );

	test( 'reinstalls the implementation after automatic mock reset', () => {
		expect( window.matchMedia( '(prefers-reduced-motion)' ).matches ).toBe(
			true
		);
	} );
} );
