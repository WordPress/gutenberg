/**
 * Internal dependencies
 */
import { __experimentalIsEditingReusableBlock } from '../selectors';

describe( '__experimentalIsEditingReusableBlock', () => {
	it( 'gets the value for clientId', () => {
		expect(
			__experimentalIsEditingReusableBlock(
				{ isEditingReusableBlock: { 1: true } },
				1
			)
		).toBe( true );
		expect(
			__experimentalIsEditingReusableBlock(
				{ isEditingReusableBlock: { 2: false } },
				2
			)
		).toBe( false );
		expect(
			__experimentalIsEditingReusableBlock(
				{ isEditingReusableBlock: { 2: false } },
				3
			)
		).toBe( undefined );
	} );
} );
