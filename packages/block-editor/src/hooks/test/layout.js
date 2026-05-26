/**
 * Internal dependencies
 */
import { getResetLayout, getResponsiveLayoutStyles } from '../layout';

describe( 'layout', () => {
	describe( 'getResetLayout()', () => {
		it( 'should reset to variation layout defaults', () => {
			const layout = getResetLayout(
				{ default: { type: 'flex' } },
				{
					attributes: {
						layout: {
							type: 'grid',
							columnCount: 3,
						},
					},
				}
			);

			expect( layout ).toEqual( {
				type: 'grid',
				columnCount: 3,
			} );
		} );

		it( 'should fall back to the block support layout defaults', () => {
			const layout = getResetLayout(
				{
					default: {
						type: 'flex',
						flexWrap: 'nowrap',
					},
				},
				undefined
			);

			expect( layout ).toEqual( {
				type: 'flex',
				flexWrap: 'nowrap',
			} );
		} );

		it( 'should return undefined when there is no layout config', () => {
			expect( getResetLayout() ).toBeUndefined();
		} );
	} );

	describe( 'getResponsiveLayoutStyles()', () => {
		it( 'generates responsive block gap styles for flow layouts', () => {
			expect(
				getResponsiveLayoutStyles( {
					attributes: {
						style: {
							mobile: {
								spacing: {
									blockGap: '12px',
								},
							},
						},
					},
					blockName: 'core/group',
					selector: '.wp-container-test',
					layout: { type: 'default' },
					hasBlockGapSupport: true,
				} )
			).toBe(
				'@media (width <= 480px){.wp-container-test > :first-child { margin-block-start: 0; }.wp-container-test > :last-child { margin-block-end: 0; }.wp-container-test > * { margin-block-start: 12px; margin-block-end: 0; }}'
			);
		} );

		it( 'generates responsive block gap styles for flex layouts', () => {
			expect(
				getResponsiveLayoutStyles( {
					attributes: {
						style: {
							mobile: {
								spacing: {
									blockGap: '12px',
								},
							},
						},
					},
					blockName: 'core/group',
					selector: '.wp-container-test',
					layout: { type: 'flex' },
					hasBlockGapSupport: true,
				} )
			).toBe(
				'@media (width <= 480px){.wp-container-test { gap: 12px; }}'
			);
		} );

		it( 'generates responsive layout styles for viewport layout overrides', () => {
			expect(
				getResponsiveLayoutStyles( {
					attributes: {
						style: {
							mobile: {
								layout: {
									minimumColumnWidth: '8rem',
								},
							},
						},
					},
					blockName: 'core/group',
					selector: '.wp-container-test',
					layout: { type: 'grid' },
					hasBlockGapSupport: true,
				} )
			).toBe(
				'@media (width <= 480px){.wp-container-test { grid-template-columns: repeat(auto-fill, minmax(min(8rem, 100%), 1fr)); }}'
			);
		} );

		it( 'generates responsive layout styles for grid column overrides', () => {
			expect(
				getResponsiveLayoutStyles( {
					attributes: {
						style: {
							mobile: {
								layout: {
									columnCount: 3,
								},
							},
						},
					},
					blockName: 'core/group',
					selector: '.wp-container-test',
					layout: { type: 'grid' },
					hasBlockGapSupport: true,
				} )
			).toBe(
				'@media (width <= 480px){.wp-container-test { grid-template-columns: repeat(3, minmax(0, 1fr)); }}'
			);
		} );

		it( 'keeps responsive grid column overrides when block gap is also changed', () => {
			expect(
				getResponsiveLayoutStyles( {
					attributes: {
						style: {
							mobile: {
								layout: {
									columnCount: 3,
								},
								spacing: {
									blockGap: '12px',
								},
							},
						},
					},
					blockName: 'core/group',
					selector: '.wp-container-test',
					layout: { type: 'grid' },
					hasBlockGapSupport: true,
				} )
			).toBe(
				'@media (width <= 480px){.wp-container-test { grid-template-columns: repeat(3, minmax(0, 1fr)); }.wp-container-test { gap: 12px; }}'
			);
		} );

		it( 'does not repeat unchanged grid layout declarations for responsive block gap styles', () => {
			expect(
				getResponsiveLayoutStyles( {
					attributes: {
						style: {
							tablet: {
								spacing: {
									blockGap: '12px',
								},
							},
						},
					},
					blockName: 'core/group',
					selector: '.wp-container-test',
					layout: { type: 'grid', minimumColumnWidth: '12rem' },
					hasBlockGapSupport: true,
				} )
			).toBe(
				'@media (480px < width <= 782px){.wp-container-test { gap: 12px; }}'
			);
		} );
	} );
} );
