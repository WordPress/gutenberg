/**
 * External dependencies
 */
import { describe, it, expect } from '@jest/globals';

/**
 * Internal dependencies
 */
import deprecated from '../deprecated';

describe( 'Navigation block v7 deprecation', () => {
	// v7 is the first deprecation in the array.
	const v7 = deprecated[ 0 ];

	describe( 'isEligible', () => {
		it( 'should return true when new defaultOverlay* attributes are undefined', () => {
			const attributes = {
				overlayTextColor: 'purple',
				overlayBackgroundColor: 'yellow',
			};

			expect( v7.isEligible( attributes ) ).toBe( true );
		} );

		it( 'should return false when new defaultOverlayTextColor exists', () => {
			const attributes = {
				defaultOverlayTextColor: 'purple',
			};

			expect( v7.isEligible( attributes ) ).toBe( false );
		} );

		it( 'should return false when new customDefaultOverlayTextColor exists', () => {
			const attributes = {
				customDefaultOverlayTextColor: '#BCC60A',
			};

			expect( v7.isEligible( attributes ) ).toBe( false );
		} );

		it( 'should return false when new defaultOverlayBackgroundColor exists', () => {
			const attributes = {
				defaultOverlayBackgroundColor: 'yellow',
			};

			expect( v7.isEligible( attributes ) ).toBe( false );
		} );

		it( 'should return false when new customDefaultOverlayBackgroundColor exists', () => {
			const attributes = {
				customDefaultOverlayBackgroundColor: '#E10E0E',
			};

			expect( v7.isEligible( attributes ) ).toBe( false );
		} );
	} );

	describe( 'migrate', () => {
		it( 'should copy overlayTextColor to both defaultOverlayTextColor and submenuTextColor', () => {
			const attributes = {
				overlayTextColor: 'purple',
			};

			const migrated = v7.migrate( attributes );

			expect( migrated.defaultOverlayTextColor ).toBe( 'purple' );
			expect( migrated.submenuTextColor ).toBe( 'purple' );
			expect( migrated.overlayTextColor ).toBeUndefined();
		} );

		it( 'should copy customOverlayTextColor to both customDefaultOverlayTextColor and customSubmenuTextColor', () => {
			const attributes = {
				customOverlayTextColor: '#BCC60A',
			};

			const migrated = v7.migrate( attributes );

			expect( migrated.customDefaultOverlayTextColor ).toBe( '#BCC60A' );
			expect( migrated.customSubmenuTextColor ).toBe( '#BCC60A' );
			expect( migrated.customOverlayTextColor ).toBeUndefined();
		} );

		it( 'should copy overlayBackgroundColor to both defaultOverlayBackgroundColor and submenuBackgroundColor', () => {
			const attributes = {
				overlayBackgroundColor: 'yellow',
			};

			const migrated = v7.migrate( attributes );

			expect( migrated.defaultOverlayBackgroundColor ).toBe( 'yellow' );
			expect( migrated.submenuBackgroundColor ).toBe( 'yellow' );
			expect( migrated.overlayBackgroundColor ).toBeUndefined();
		} );

		it( 'should copy customOverlayBackgroundColor to both customDefaultOverlayBackgroundColor and customSubmenuBackgroundColor', () => {
			const attributes = {
				customOverlayBackgroundColor: '#E10E0E',
			};

			const migrated = v7.migrate( attributes );

			expect( migrated.customDefaultOverlayBackgroundColor ).toBe(
				'#E10E0E'
			);
			expect( migrated.customSubmenuBackgroundColor ).toBe( '#E10E0E' );
			expect( migrated.customOverlayBackgroundColor ).toBeUndefined();
		} );

		it( 'should migrate all overlay colors at once', () => {
			const attributes = {
				overlayTextColor: 'purple',
				customOverlayTextColor: '#BCC60A',
				overlayBackgroundColor: 'yellow',
				customOverlayBackgroundColor: '#E10E0E',
			};

			const migrated = v7.migrate( attributes );

			expect( migrated.defaultOverlayTextColor ).toBe( 'purple' );
			expect( migrated.submenuTextColor ).toBe( 'purple' );
			expect( migrated.customDefaultOverlayTextColor ).toBe( '#BCC60A' );
			expect( migrated.customSubmenuTextColor ).toBe( '#BCC60A' );
			expect( migrated.defaultOverlayBackgroundColor ).toBe( 'yellow' );
			expect( migrated.submenuBackgroundColor ).toBe( 'yellow' );
			expect( migrated.customDefaultOverlayBackgroundColor ).toBe(
				'#E10E0E'
			);
			expect( migrated.customSubmenuBackgroundColor ).toBe( '#E10E0E' );

			// Old attributes should be unset.
			expect( migrated.overlayTextColor ).toBeUndefined();
			expect( migrated.customOverlayTextColor ).toBeUndefined();
			expect( migrated.overlayBackgroundColor ).toBeUndefined();
			expect( migrated.customOverlayBackgroundColor ).toBeUndefined();
		} );

		it( 'should preserve other attributes', () => {
			const attributes = {
				overlayTextColor: 'purple',
				textColor: 'blue',
				backgroundColor: 'red',
			};

			const migrated = v7.migrate( attributes );

			expect( migrated.textColor ).toBe( 'blue' );
			expect( migrated.backgroundColor ).toBe( 'red' );
		} );
	} );
} );
