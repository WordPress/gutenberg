import { describe, expect, it } from 'vitest';
import groups from '../groups';

describe( 'InspectorControls groups', () => {
	it( 'returns the existing Slot/Fill pair for a known core group', () => {
		expect( groups.styles ).toBeDefined();
		expect( groups.styles.name ).toBe( 'InspectorControlsStyles' );
	} );

	it( 'lazily creates a Slot/Fill pair for an unknown group name', () => {
		const group = groups[ 'my-plugin/custom-tab' ];
		expect( group ).toBeDefined();
		expect( group.Fill ).toBeDefined();
		expect( group.Slot ).toBeDefined();
	} );

	it( 'returns the same Slot/Fill pair on repeated access for the same custom name', () => {
		const first = groups[ 'my-plugin/another-tab' ];
		const second = groups[ 'my-plugin/another-tab' ];
		expect( second ).toBe( first );
	} );

	it( 'returns different Slot/Fill pairs for different custom group names', () => {
		expect( groups[ 'my-plugin/tab-a' ] ).not.toBe(
			groups[ 'my-plugin/tab-b' ]
		);
	} );
} );
