/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import {
	setupWidgetAreas,
	updateBlocksInWidgetArea,
} from '../actions';

describe( 'actions', () => {
	beforeAll( () => {
		registerCoreBlocks();
	} );

	describe( 'setupWidgetAreas', () => {
		it( 'should return SETUP_WIDGET_AREAS action', () => {
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
} );
