import { describe, it, expect } from 'vitest';
import { getAlignmentUpdates, withTextAlign } from '../text-align';
import type { LayoutValues } from '../text-align';

const flow: LayoutValues = { type: undefined };
const flex = (
	justifyContent?: string,
	orientation?: string
): LayoutValues => ( {
	type: 'flex',
	justifyContent,
	orientation,
} );

describe( 'getAlignmentUpdates', () => {
	describe( 'into Flex', () => {
		it.each( [
			[ 'left', false, 'left' ],
			[ 'center', false, 'center' ],
			[ 'right', false, 'right' ],
			[ 'left', true, 'right' ],
			[ 'right', true, 'left' ],
			[ 'center', true, 'center' ],
		] )(
			'turns %s into Justification (rtl: %s) %s',
			( textAlign, isRtl, expected ) => {
				expect(
					getAlignmentUpdates( flow, flex(), textAlign, isRtl )
				).toEqual( { justifyContent: expected } );
			}
		);

		it( 'writes nothing when no alignment is set', () => {
			expect(
				getAlignmentUpdates( flow, flex(), undefined, false )
			).toBeNull();
			expect(
				getAlignmentUpdates( flow, flex(), undefined, true )
			).toBeNull();
		} );

		it( 'keeps a Justification that is already set', () => {
			expect(
				getAlignmentUpdates( flow, flex( 'center' ), 'right', false )
			).toBeNull();
		} );

		it( 'does not convert in a vertical Flex', () => {
			expect(
				getAlignmentUpdates(
					flow,
					flex( undefined, 'vertical' ),
					'right',
					false
				)
			).toBeNull();
		} );

		it( 'converts when coming from Grid', () => {
			expect(
				getAlignmentUpdates( { type: 'grid' }, flex(), 'center', false )
			).toEqual( { justifyContent: 'center' } );
		} );
	} );

	describe( 'out of Flex', () => {
		it.each( [ false, true ] )(
			'writes nothing when Justification was never set (rtl: %s)',
			( isRtl ) => {
				expect(
					getAlignmentUpdates( flex(), flow, undefined, isRtl )
				).toBeNull();
				expect(
					getAlignmentUpdates( flex(), flow, 'left', isRtl )
				).toBeNull();
			}
		);

		it.each( [
			[ 'left', false ],
			[ 'right', false ],
			[ 'center', false ],
			[ 'left', true ],
			[ 'right', true ],
		] )(
			'keeps the alignment %s when Justification came from it (rtl: %s)',
			( textAlign, isRtl ) => {
				const converted = getAlignmentUpdates(
					flow,
					flex(),
					textAlign,
					isRtl
				);
				const justifyContent =
					converted && 'justifyContent' in converted
						? converted.justifyContent
						: undefined;
				expect(
					getAlignmentUpdates(
						flex( justifyContent ),
						flow,
						textAlign,
						isRtl
					)
				).toBeNull();
			}
		);

		it( 'keeps an explicit left alignment', () => {
			expect(
				getAlignmentUpdates( flex( 'left' ), flow, 'left', false )
			).toBeNull();
		} );

		it( 'does not add an alignment for the default Justification', () => {
			expect(
				getAlignmentUpdates( flex( 'left' ), flow, undefined, false )
			).toBeNull();
		} );

		it.each( [
			[ 'center', undefined, false, 'center' ],
			[ 'right', undefined, false, 'right' ],
			[ 'right', undefined, true, 'left' ],
			[ 'center', 'right', false, 'center' ],
			[ 'left', 'right', false, 'left' ],
		] )(
			'carries Justification %s over to the alignment (was %s, rtl: %s)',
			( justifyContent, textAlign, isRtl, expected ) => {
				expect(
					getAlignmentUpdates(
						flex( justifyContent ),
						flow,
						textAlign,
						isRtl
					)
				).toEqual( { textAlign: expected } );
			}
		);

		it( 'clears the alignment for space-between', () => {
			expect(
				getAlignmentUpdates(
					flex( 'space-between' ),
					flow,
					'right',
					false
				)
			).toEqual( { textAlign: null } );
		} );

		it( 'does not convert out of a vertical Flex', () => {
			expect(
				getAlignmentUpdates(
					flex( 'center', 'vertical' ),
					flow,
					undefined,
					false
				)
			).toBeNull();
		} );

		it( 'carries Justification over when moving to Grid', () => {
			expect(
				getAlignmentUpdates(
					flex( 'center' ),
					{ type: 'grid' },
					undefined,
					false
				)
			).toEqual( { textAlign: 'center' } );
		} );
	} );

	it( 'does nothing when the type does not change', () => {
		expect(
			getAlignmentUpdates( flex( 'center' ), flex(), 'right', false )
		).toBeNull();
		expect( getAlignmentUpdates( flow, flow, 'right', false ) ).toBeNull();
	} );
} );

describe( 'withTextAlign', () => {
	it( 'sets the alignment and keeps other styles', () => {
		expect( withTextAlign( { color: { text: 'red' } }, 'center' ) ).toEqual(
			{
				color: { text: 'red' },
				typography: { textAlign: 'center' },
			}
		);
		expect(
			withTextAlign(
				{ typography: { fontSize: '1em', textAlign: 'left' } },
				'right'
			)
		).toEqual( { typography: { fontSize: '1em', textAlign: 'right' } } );
	} );

	it( 'removes the alignment and empty typography', () => {
		expect(
			withTextAlign( { typography: { textAlign: 'left' } }, null )
		).toEqual( {} );
		expect(
			withTextAlign(
				{ typography: { fontSize: '1em', textAlign: 'left' } },
				null
			)
		).toEqual( { typography: { fontSize: '1em' } } );
		expect( withTextAlign( undefined, null ) ).toEqual( {} );
	} );
} );
