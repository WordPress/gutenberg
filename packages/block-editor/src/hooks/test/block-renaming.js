/**
 * Internal dependencies
 */
import { addLabelCallback } from '../block-renaming';

describe( 'block-renaming addLabelCallback', () => {
	it( 'does not override when block has label callback', () => {
		const customLabel = () => 'Custom';
		const settings = {
			supports: { renaming: true },
			label: customLabel,
		};

		const result = addLabelCallback( settings );

		expect( result.label ).toBe( customLabel );
	} );

	it( 'does not override when block has __experimentalLabel callback', () => {
		const customLabel = () => 'Custom';
		const settings = {
			supports: { renaming: true },
			__experimentalLabel: customLabel,
		};

		const result = addLabelCallback( settings );

		expect( console ).toHaveWarned();
		expect( result ).toBe( settings );
	} );

	it( 'adds label callback for blocks that support renaming', () => {
		const settings = {
			supports: { renaming: true },
		};

		const result = addLabelCallback( settings );

		expect( typeof result.label ).toBe( 'function' );
		expect(
			result.label(
				{ metadata: { name: 'My Block' } },
				{ context: 'list-view' }
			)
		).toBe( 'My Block' );
	} );

	it( 'does not add label callback when renaming is not supported', () => {
		const settings = {
			supports: { renaming: false },
		};

		const result = addLabelCallback( settings );

		expect( result.label ).toBeUndefined();
	} );
} );
