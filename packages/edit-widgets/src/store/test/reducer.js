/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	widgetAreas,
	widgetAreaBlocks,
} from '../reducer';

describe( 'state', () => {
	describe( 'widgetAreas', () => {
		it( 'should correctly initialize the state', () => {
			expect( widgetAreas() ).toEqual( {} );
		} );

		it( 'should correctly return the state', () => {
			const original = deepFreeze( widgetAreas() );
			const state = widgetAreas( original, {
				type: 'SETUP_WIDGET_AREAS',
				widgetAreas: [
					{
						id: 'sidebar-1',
						name: 'My sidebar',
						description: 'A test sidebar',
						irrelevantProp: 'ok',
					},
				],
			} );

			expect( state ).toEqual( {
				'sidebar-1': {
					id: 'sidebar-1',
					name: 'My sidebar',
					description: 'A test sidebar',
				},
			} );
		} );
	} );
	describe( 'widgetAreaBlocks', () => {
		it( 'should correctly initialize the state', () => {
			expect( widgetAreaBlocks() ).toEqual( {} );
		} );

		it( 'should correctly return the state after a setup action', () => {
			const original = deepFreeze( widgetAreaBlocks() );
			const state = widgetAreaBlocks( original, {
				type: 'SETUP_WIDGET_AREAS',
				widgetAreas: [
					{
						id: 'sidebar-1',
						name: 'My sidebar',
						description: 'A test sidebar',
						blocks: [ {
							clientId: 'ribs',
							name: 'core/test',
							attributes: {
								isOk: true,
							},
						} ],
					},
				],
			} );

			expect( state ).toEqual( {
				'sidebar-1': [ {
					clientId: 'ribs',
					name: 'core/test',
					attributes: {
						isOk: true,
					},
				} ],
			} );
		} );
		it( 'should correctly update the blocks', () => {
			const original = deepFreeze( {
				'sidebar-1': [ {
					clientId: 'ribs',
					name: 'core/test',
					attributes: {
						isOk: true,
					},
				} ],
			} );
			const state = widgetAreaBlocks( original, {
				type: 'UPDATE_BLOCKS_IN_WIDGET_AREA',
				widgetAreaId: 'sidebar-1',
				blocks: [ {
					clientId: 'test',
					name: 'core/test-ok',
					attributes: {
						content: 'Content',
					},
				}, {
					clientId: 'ribs',
					name: 'core/test',
					attributes: {
						isOk: true,
					},
				} ],
			} );

			expect( state ).toEqual( {
				'sidebar-1': [ {
					clientId: 'test',
					name: 'core/test-ok',
					attributes: {
						content: 'Content',
					},
				}, {
					clientId: 'ribs',
					name: 'core/test',
					attributes: {
						isOk: true,
					},
				} ],
			} );
		} );
	} );
} );
