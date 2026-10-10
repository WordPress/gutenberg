import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
	getLayoutStateOverrides,
	getResetLayout,
	getResponsiveLayoutStyles,
	hasLayoutPanelControls,
	useLayoutStyles,
} from '../layout';
import { getLayoutType } from '../../layouts';
import { useSettings } from '../../components/use-settings';

vi.mock(
	import( '../../components/use-settings' ),
	async ( importOriginal ) => ( {
		...( await importOriginal() ),
		useSettings: vi.fn(),
	} )
);

describe( 'layout', () => {
	describe( 'useLayoutStyles()', () => {
		const attributes = {
			layout: { type: 'flex' },
			style: { spacing: { blockGap: '10px' } },
		};

		it.each( [ null, undefined ] )(
			'outputs no layout styles when the block gap setting is %s',
			( blockGapSetting ) => {
				useSettings.mockReturnValue( [ blockGapSetting ] );

				const { result } = renderHook( () =>
					useLayoutStyles( attributes, 'test/block', '.my-container' )
				);

				expect( result.current ).toBe( '' );
			}
		);

		it( 'outputs block gap styles when the theme opts into block gap', () => {
			useSettings.mockReturnValue( [ true ] );

			const { result } = renderHook( () =>
				useLayoutStyles( attributes, 'test/block', '.my-container' )
			);

			expect( result.current ).toContain(
				'.my-container { gap: 10px; }'
			);
		} );
	} );

	describe( 'hasLayoutPanelControls()', () => {
		it( 'does not show the layout panel when every flex layout control is disabled', () => {
			expect(
				hasLayoutPanelControls( {
					layoutType: getLayoutType( 'flex' ),
					constrainedType: getLayoutType( 'constrained' ),
					layoutBlockSupport: {
						allowSwitching: false,
						allowInheriting: false,
						allowEditing: true,
						allowOrientation: false,
						allowJustification: false,
						allowVerticalAlignment: false,
						allowWrap: false,
						allowSizingOnChildren: true,
						default: { type: 'flex' },
					},
					showInheritToggle: false,
					showLayoutTypeSwitcher: false,
					displayControlsForLegacyLayouts: false,
				} )
			).toBe( false );
		} );
	} );

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

	describe( 'getLayoutStateOverrides()', () => {
		it( 'preserves explicit unsets for layout values inherited from the default state', () => {
			expect(
				getLayoutStateOverrides(
					{ type: 'grid', columnCount: undefined },
					{ type: 'grid', columnCount: 3 }
				)
			).toEqual( {
				columnCount: null,
			} );
		} );

		it( 'removes undefined layout values that are not inherited from the default state', () => {
			expect(
				getLayoutStateOverrides(
					{ type: 'grid', columnCount: undefined },
					{ type: 'grid' }
				)
			).toBeUndefined();
		} );
	} );

	describe( 'getResponsiveLayoutStyles()', () => {
		it( 'generates responsive block gap styles for flow layouts', () => {
			expect(
				getResponsiveLayoutStyles( {
					attributes: {
						style: {
							'@mobile': {
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
							'@mobile': {
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
							'@mobile': {
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
							'@mobile': {
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

		describe( 'mobile stacking', () => {
			const manualGridLayout = {
				type: 'grid',
				isManualPlacement: true,
				columnCount: 3,
			};
			const stackingCSS =
				'.wp-container-test.wp-container-test { aspect-ratio: auto; grid-template-rows: none; grid-auto-rows: auto; }' +
				'.wp-container-test.wp-container-test > * { grid-column: 1 / -1; grid-row: span var(--wp--grid-item--row-span, 1); }';

			let originalExperiment;
			beforeEach( () => {
				originalExperiment =
					window.__experimentalEnableGridInteractivity;
				window.__experimentalEnableGridInteractivity = true;
			} );
			afterEach( () => {
				window.__experimentalEnableGridInteractivity =
					originalExperiment;
			} );

			it( 'stacks the children of a manual placement grid on mobile', () => {
				expect(
					getResponsiveLayoutStyles( {
						attributes: {},
						blockName: 'core/group',
						selector: '.wp-container-test',
						layout: manualGridLayout,
						hasBlockGapSupport: true,
					} )
				).toBe( `@media (width <= 480px){${ stackingCSS }}` );
			} );

			it( 'combines mobile stacking with mobile layout overrides', () => {
				expect(
					getResponsiveLayoutStyles( {
						attributes: {
							style: {
								'@mobile': { layout: { columnCount: 2 } },
							},
						},
						blockName: 'core/group',
						selector: '.wp-container-test',
						layout: manualGridLayout,
						hasBlockGapSupport: true,
					} )
				).toBe(
					`@media (width <= 480px){.wp-container-test { grid-template-columns: repeat(2, minmax(0, 1fr)); }${ stackingCSS }}`
				);
			} );

			it( 'does not stack a manual placement grid when stacking is turned off', () => {
				expect(
					getResponsiveLayoutStyles( {
						attributes: {},
						blockName: 'core/group',
						selector: '.wp-container-test',
						layout: { ...manualGridLayout, stackOnMobile: false },
						hasBlockGapSupport: true,
					} )
				).toBe( '' );
			} );

			it( 'does not stack a manual placement grid when stacking is turned off on mobile', () => {
				expect(
					getResponsiveLayoutStyles( {
						attributes: {
							style: {
								'@mobile': { layout: { stackOnMobile: false } },
							},
						},
						blockName: 'core/group',
						selector: '.wp-container-test',
						layout: manualGridLayout,
						hasBlockGapSupport: true,
					} )
				).toBe( '' );
			} );

			it( 'does not stack a grid switched to auto placement on mobile', () => {
				expect(
					getResponsiveLayoutStyles( {
						attributes: {
							style: {
								'@mobile': {
									layout: { isManualPlacement: null },
								},
							},
						},
						blockName: 'core/group',
						selector: '.wp-container-test',
						layout: manualGridLayout,
						hasBlockGapSupport: true,
					} )
				).not.toContain( 'grid-row: span' );
			} );

			it( 'does not stack auto placement grids', () => {
				expect(
					getResponsiveLayoutStyles( {
						attributes: {},
						blockName: 'core/group',
						selector: '.wp-container-test',
						layout: { type: 'grid', columnCount: 3 },
						hasBlockGapSupport: true,
					} )
				).toBe( '' );
			} );

			it( 'does not stack manual placement grids without the grid interactivity experiment', () => {
				window.__experimentalEnableGridInteractivity = false;
				expect(
					getResponsiveLayoutStyles( {
						attributes: {},
						blockName: 'core/group',
						selector: '.wp-container-test',
						layout: manualGridLayout,
						hasBlockGapSupport: true,
					} )
				).toBe( '' );
			} );
		} );

		it( 'generates responsive auto grid columns when column count is unset', () => {
			expect(
				getResponsiveLayoutStyles( {
					attributes: {
						style: {
							'@mobile': {
								layout: {
									columnCount: null,
								},
							},
						},
					},
					blockName: 'core/group',
					selector: '.wp-container-test',
					layout: { type: 'grid', columnCount: 3 },
					hasBlockGapSupport: true,
				} )
			).toBe(
				'@media (width <= 480px){.wp-container-test { grid-template-columns: repeat(auto-fill, minmax(min(12rem, 100%), 1fr)); container-type: inline-size; }}'
			);
		} );

		it( 'generates responsive constrained size resets when content width is unset', () => {
			const result = getResponsiveLayoutStyles( {
				attributes: {
					style: {
						'@mobile': {
							layout: {
								contentSize: null,
							},
						},
					},
				},
				blockName: 'core/group',
				selector: '.wp-container-test',
				layout: { type: 'constrained', contentSize: '800px' },
				hasBlockGapSupport: true,
			} );

			expect( result ).toContain( '@media (width <= 480px)' );
			expect( result ).toContain(
				'max-width: var(--wp--style--global--content-size, none);'
			);
			expect( result ).toContain(
				'max-width: var(--wp--style--global--wide-size, none);'
			);
		} );

		it( 'keeps responsive grid column overrides when block gap is also changed', () => {
			expect(
				getResponsiveLayoutStyles( {
					attributes: {
						style: {
							'@mobile': {
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
							'@tablet': {
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
