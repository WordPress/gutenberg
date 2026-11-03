import { afterEach, describe, expect, it } from 'vitest';
import {
	createBlock,
	getBlockTypes,
	registerBlockType,
	switchToBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import {
	addTransforms,
	getChildLayoutStyleRules,
	getChildLayoutStyles,
	getResponsiveChildLayoutStyles,
	getUpdatedChildLayoutStyle,
} from '../layout-child';

describe( 'layout child', () => {
	describe( 'getChildLayoutStyleRules()', () => {
		it( 'preserves legacy fixed sizing as shrinkable max width', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: {
						selfStretch: 'fixed',
						flexSize: '320px',
					},
				} )
			).toEqual( [
				{
					selector: '.wp-container-content-test',
					declarations: {
						'flex-basis': '320px',
						'box-sizing': 'border-box',
					},
				},
			] );
		} );

		it( 'adds flex-shrink for fixedNoShrink sizing', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: {
						selfStretch: 'fixedNoShrink',
						flexSize: '320px',
					},
				} )
			).toEqual( [
				{
					selector: '.wp-container-content-test',
					declarations: {
						'flex-basis': '320px',
						'flex-shrink': '0',
						'box-sizing': 'border-box',
					},
				},
			] );
		} );

		it( 'allows viewport overrides to switch fixedNoShrink to max', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: {
						selfStretch: 'fixedNoShrink',
						flexSize: '320px',
					},
					viewportOverrides: {
						selfStretch: 'fixed',
					},
				} )
			).toEqual( [
				{
					selector: '.wp-container-content-test',
					declarations: {
						'flex-basis': '320px',
						'flex-shrink': 'unset',
						'box-sizing': 'border-box',
					},
				},
			] );
		} );

		it( 'allows viewport overrides to switch fixedNoShrink to fit', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: {
						selfStretch: 'fixedNoShrink',
						flexSize: '320px',
					},
					viewportOverrides: {
						selfStretch: 'fit',
					},
				} )
			).toEqual( [
				{
					selector: '.wp-container-content-test',
					declarations: {
						'flex-basis': 'unset',
						'flex-shrink': 'unset',
					},
				},
			] );
		} );

		it( 'allows viewport overrides to switch fixed to fit', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: {
						selfStretch: 'fixed',
						flexSize: '320px',
					},
					viewportOverrides: {
						selfStretch: 'fit',
					},
				} )
			).toEqual( [
				{
					selector: '.wp-container-content-test',
					declarations: {
						'flex-basis': 'unset',
					},
				},
			] );
		} );

		it( 'allows viewport overrides to switch fixedNoShrink to grow', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: {
						selfStretch: 'fixedNoShrink',
						flexSize: '320px',
					},
					viewportOverrides: {
						selfStretch: 'fill',
					},
				} )
			).toEqual( [
				{
					selector: '.wp-container-content-test',
					declarations: {
						'flex-basis': 'unset',
						'flex-shrink': 'unset',
						'flex-grow': '1',
					},
				},
			] );
		} );

		it( 'allows viewport overrides to switch fixed to grow', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: {
						selfStretch: 'fixed',
						flexSize: '320px',
					},
					viewportOverrides: {
						selfStretch: 'fill',
					},
				} )
			).toEqual( [
				{
					selector: '.wp-container-content-test',
					declarations: {
						'flex-basis': 'unset',
						'flex-grow': '1',
					},
				},
			] );
		} );
	} );

	describe( 'getUpdatedChildLayoutStyle()', () => {
		it( 'stores resizer changes in the selected viewport when no default child layout exists', () => {
			const style = getUpdatedChildLayoutStyle(
				undefined,
				{
					columnSpan: 2,
					rowSpan: 1,
				},
				{
					viewport: '@mobile',
					pseudo: 'default',
				}
			);

			expect(
				getChildLayoutStyles( {
					selector: '.wp-container-content-test',
					layout: style?.layout,
				} )
			).toBe( '' );
			expect(
				getResponsiveChildLayoutStyles( {
					style,
					selector: '.wp-container-content-test',
				} )
			).toBe(
				'@media (width <= 480px){.wp-container-content-test {\n\t\tgrid-column: span 2; grid-row: span 1;\n\t}}'
			);
		} );

		it( 'stores resizer changes in the selected viewport when a pseudo state is also selected', () => {
			expect(
				getUpdatedChildLayoutStyle(
					undefined,
					{
						columnSpan: 2,
						rowSpan: 1,
					},
					{
						viewport: '@mobile',
						pseudo: ':hover',
					}
				)
			).toEqual( {
				'@mobile': {
					layout: {
						columnSpan: 2,
						rowSpan: 1,
					},
				},
			} );
		} );
	} );

	describe( 'addTransforms()', () => {
		const gridLayout = {
			columnStart: 2,
			rowStart: 1,
			columnSpan: 3,
			rowSpan: 2,
		};

		function getBlock(
			clientId: string,
			attributes: Record< string, unknown > = {},
			innerBlocks: Block[] = []
		): Block {
			return {
				name: 'core/test',
				clientId,
				isValid: true,
				attributes,
				innerBlocks,
			};
		}

		afterEach( () => {
			getBlockTypes().forEach( ( block ) => {
				unregisterBlockType( block.name );
			} );
		} );

		const sourceFactories: Array<
			[ string, ( block: Block ) => Block | Block[] ]
		> = [
			[ 'a block', ( block ) => block ],
			[ 'an array of one block', ( block ) => [ block ] ],
		];

		it.each( sourceFactories )(
			'keeps the child layout when %s is switched to a block type that drops its style',
			( _, getSource ) => {
				registerBlockType( 'core/test-from', {
					apiVersion: 3,
					title: 'From',
					category: 'common',
					attributes: { style: { type: 'object' } },
					transforms: {
						to: [
							{
								type: 'block',
								blocks: [ 'core/test-to' ],
								transform: () => createBlock( 'core/test-to' ),
							},
						],
					},
					save: () => null,
				} );
				registerBlockType( 'core/test-to', {
					apiVersion: 3,
					title: 'To',
					category: 'common',
					attributes: { style: { type: 'object' } },
					save: () => null,
				} );

				const transformed = switchToBlockType(
					getSource(
						createBlock( 'core/test-from', {
							style: {
								layout: gridLayout,
								'@mobile': { layout: { columnSpan: 1 } },
							},
						} )
					),
					'core/test-to'
				);

				if ( ! transformed ) {
					throw new Error(
						'Expected the block transform to succeed.'
					);
				}

				expect( transformed[ 0 ].attributes.style ).toEqual( {
					layout: gridLayout,
					'@mobile': { layout: { columnSpan: 1 } },
				} );
			}
		);

		it( 'keeps the other styles of the transformed block', () => {
			const transformed = addTransforms(
				getBlock( '2', {
					style: { typography: { textAlign: 'center' } },
				} ),
				[ getBlock( '1', { style: { layout: gridLayout } } ) ],
				0,
				[ getBlock( '2' ) ]
			);

			expect( transformed.attributes.style ).toEqual( {
				typography: { textAlign: 'center' },
				layout: gridLayout,
			} );
		} );

		it( 'keeps a child layout the transform set itself', () => {
			const result = getBlock( '2', {
				style: { layout: { columnSpan: 1 } },
			} );
			const transformed = addTransforms(
				result,
				[ getBlock( '1', { style: { layout: gridLayout } } ) ],
				0,
				[ result ]
			);

			expect( transformed.attributes.style ).toEqual( {
				layout: { columnSpan: 1 },
			} );
		} );

		it( 'keeps each child layout when as many blocks result as were transformed', () => {
			const source = [
				getBlock( '1', { style: { layout: { columnStart: 1 } } } ),
				getBlock( '2', { style: { layout: { columnStart: 3 } } } ),
			];
			const results = [ getBlock( '3' ), getBlock( '4' ) ];

			expect(
				addTransforms( results[ 1 ], source, 1, results ).attributes
					.style
			).toEqual( { layout: { columnStart: 3 } } );
		} );

		it( 'does not copy the child layout to a block that wraps the transformed blocks', () => {
			const source = [
				getBlock( '1', { style: { layout: gridLayout } } ),
			];
			const result = getBlock( '2', {}, source );

			expect(
				addTransforms( result, source, 0, [ result ] ).attributes.style
			).toBeUndefined();
		} );

		it( 'does not copy the child layout when one block becomes many', () => {
			const results = [ getBlock( '2' ), getBlock( '3' ) ];

			expect(
				addTransforms(
					results[ 0 ],
					[ getBlock( '1', { style: { layout: gridLayout } } ) ],
					0,
					results
				).attributes.style
			).toBeUndefined();
		} );

		it( 'does not copy the child layout when many blocks become one', () => {
			const result = getBlock( '3' );

			expect(
				addTransforms(
					result,
					[
						getBlock( '1', { style: { layout: gridLayout } } ),
						getBlock( '2', { style: { layout: gridLayout } } ),
					],
					0,
					[ result ]
				).attributes.style
			).toBeUndefined();
		} );
	} );
} );
