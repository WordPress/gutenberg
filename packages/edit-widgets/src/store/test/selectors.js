/**
 * Internal dependencies
 */
import {
	getBlocksFromWidgetArea,
	getWidgetAreas,
} from '../selectors';

describe( 'selectors', () => {
	describe( 'getWidgetAreas', () => {
		it( 'should return an array with the widget areas', () => {
			const state = {
				widgetAreas: {
					'sidebar-1': {
						id: 'sidebar-1',
					},
					'footer-1': {
						id: 'footer-1',
					},
				},
			};

			expect( getWidgetAreas( state ) ).toEqual( [
				{
					id: 'sidebar-1',
				},
				{
					id: 'footer-1',
				},
			] );
		} );
	} );

	describe( 'getBlocksFromWidgetArea', () => {
		it( 'should return the blocks in a widget area', () => {
			const state = {
				widgetAreaBlocks: {
					'sidebar-1': [
						{
							name: 'test/ribs',
							attributes: {
								myAttr: false,
							},
						},
					],
					'footer-1': [],
				},
			};

			expect( getBlocksFromWidgetArea( state, 'sidebar-1' ) ).toEqual( [
				{
					name: 'test/ribs',
					attributes: {
						myAttr: false,
					},
				},
			] );
			expect( getBlocksFromWidgetArea( state, 'footer-1' ) ).toEqual( [] );
		} );
	} );
} );
