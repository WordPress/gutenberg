/**
 * WordPress dependencies
 */
import { createBlock, serialize } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import {
	saveWidgetAreas,
	setupWidgetAreas,
	updateBlocksInWidgetArea,
} from '../actions';

describe( 'actions', () => {
	beforeAll( () => {
		registerCoreBlocks();
	} );

	describe( 'setupWidgetAreas', () => {
		it( 'should yield SETUP_WIDGET_AREAS action', () => {
			const setupWidgetAreasGen = setupWidgetAreas();
			setupWidgetAreasGen.next();
			expect(
				setupWidgetAreasGen.next( [
					{
						id: 'sidebar-1',
						content: {
							raw: '<!-- wp:paragraph --><p>Test block</p><!-- /wp:paragraph -->',
						},
					},
					{
						id: 'footer-1',
					},
				] )
			).toMatchObject( {
				done: false,
				value: {
					type: 'SETUP_WIDGET_AREAS',
					widgetAreas: [
						{
							id: 'sidebar-1',
							blocks: [ {
								name: 'core/paragraph',
								attributes: {
									content: 'Test block',
								},
							} ],
						},
						{
							id: 'footer-1',
							blocks: [],
						},
					],
				},
			} );
			expect( setupWidgetAreasGen.next() ).toEqual( {
				done: true,
				value: undefined,
			} );
		} );
	} );

	describe( 'updateBlocksInWidgetArea', () => {
		it( 'should return UPDATE_BLOCKS_IN_WIDGET_AREA action', () => {
			expect( updateBlocksInWidgetArea( 'sidebar-1', [
				{
					name: 'test/ribs',
					attributes: {
						myAttr: false,
					},
				},
			] ) ).toEqual( {
				type: 'UPDATE_BLOCKS_IN_WIDGET_AREA',
				widgetAreaId: 'sidebar-1',
				blocks: [
					{
						name: 'test/ribs',
						attributes: {
							myAttr: false,
						},
					},
				],
			} );
		} );
	} );

	describe( 'saveWidgetAreas', () => {
		it( 'should yield the actions to save a widget area', () => {
			const saveWidgetAreasGen = saveWidgetAreas();

			expect(
				saveWidgetAreasGen.next()
			).toEqual( {
				done: false,
				value: {
					type: 'SELECT',
					storeKey: 'core/edit-widgets',
					selectorName: 'getWidgetAreas',
					args: [],
				},
			} );

			expect(
				saveWidgetAreasGen.next( [
					{
						id: 'sidebar-1',
						blocks: [ {
							name: 'core/paragraph',
							attributes: {
								content: 'Test block',
							},
						} ],
					},
					{
						id: 'footer-1',
						blocks: [],
					},
				] )
			).toEqual( {
				done: false,
				value: {
					type: 'SELECT',
					storeKey: 'core/edit-widgets',
					selectorName: 'getBlocksFromWidgetArea',
					args: [ 'sidebar-1' ],
				},
			} );

			expect(
				saveWidgetAreasGen.next( [
					createBlock( 'core/paragraph', { content: 'Content' } ),
				] )
			).toEqual( {
				done: false,
				value: {
					type: 'DISPATCH',
					storeKey: 'core',
					actionName: 'saveWidgetArea',
					args: [ {
						id: 'sidebar-1',
						content: serialize(
							createBlock( 'core/paragraph', { content: 'Content' } )
						),
					} ],
				},
			} );

			expect(
				saveWidgetAreasGen.next()
			).toEqual( {
				done: false,
				value: {
					type: 'SELECT',
					storeKey: 'core/edit-widgets',
					selectorName: 'getBlocksFromWidgetArea',
					args: [ 'footer-1' ],
				},
			} );

			expect(
				saveWidgetAreasGen.next( [
					createBlock( 'core/button', { text: 'My Button' } ),
				] )
			).toEqual( {
				done: false,
				value: {
					type: 'DISPATCH',
					storeKey: 'core',
					actionName: 'saveWidgetArea',
					args: [ {
						id: 'footer-1',
						content: serialize(
							createBlock( 'core/button', { text: 'My Button' } )
						),
					} ],
				},
			} );

			expect(
				saveWidgetAreasGen.next()
			).toEqual( {
				done: false,
				value: {
					type: 'DISPATCH',
					storeKey: 'core/notices',
					actionName: 'createSuccessNotice',
					args: [
						'Block areas saved succesfully.',
						{
							id: 'WIDGET_AREAS_SAVE_NOTICE_ID',
							type: 'snackbar',
						},
					],
				},
			} );

			expect(
				saveWidgetAreasGen.next()
			).toEqual( {
				done: true,
				value: undefined,
			} );
		} );
	} );
} );
