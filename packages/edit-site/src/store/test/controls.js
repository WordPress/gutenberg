/**
 * Internal dependencies
 */
import controls, { findTemplate } from '../controls';
import { findTemplate as findTemplateUtil } from '../../utils';

jest.mock( '../../utils', () => {
	return {
		__esModule: true,
		findTemplate: jest.fn( () => 1 ),
	};
} );

describe( 'controls', () => {
	describe( 'findTemplate', () => {
		it( 'should return the FIND_TEMPLATE control descriptor', () => {
			expect( findTemplate( '/' ) ).toEqual( {
				type: 'FIND_TEMPLATE',
				path: '/',
			} );
		} );
	} );

	describe( 'controls.FIND_TEMPLATE', () => {
		it( 'should be a registry control that calls the `findTemplate` util with the provided path and the `getEntityRecords` resolve selector', () => {
			const getEntityRecords = {};
			const registry = {
				__experimentalResolveSelect: jest.fn( () => ( {
					getEntityRecords,
				} ) ),
			};
			expect( controls.FIND_TEMPLATE( registry )( { path: '/' } ) ).toBe(
				1
			);
			expect( registry.__experimentalResolveSelect ).toHaveBeenCalledWith(
				'core'
			);
			expect( findTemplateUtil ).toHaveBeenCalledWith(
				'/',
				getEntityRecords
			);
		} );
	} );
} );
