/**
 * Internal dependencies
 */
import {
	toggleFeature,
	setTemplate,
	addTemplate,
	removeTemplate,
	setTemplatePart,
	setPage,
} from '../actions';

describe( 'actions', () => {
	describe( 'toggleFeature', () => {
		it( 'should return TOGGLE_FEATURE action', () => {
			const feature = 'name';
			expect( toggleFeature( feature ) ).toEqual( {
				type: 'TOGGLE_FEATURE',
				feature,
			} );
		} );
	} );

	describe( 'setTemplate', () => {
		it( 'should return the SET_TEMPLATE action', () => {
			const templateId = 1;
			expect( setTemplate( templateId ) ).toEqual( {
				type: 'SET_TEMPLATE',
				templateId,
			} );
		} );
	} );

	describe( 'addTemplate', () => {
		it( 'should return the ADD_TEMPLATE action', () => {
			const templateId = 1;
			expect( addTemplate( templateId ) ).toEqual( {
				type: 'ADD_TEMPLATE',
				templateId,
			} );
		} );
	} );

	describe( 'removeTemplate', () => {
		it( 'should return the REMOVE_TEMPLATE action', () => {
			const templateId = 1;
			expect( removeTemplate( templateId ) ).toEqual( {
				type: 'REMOVE_TEMPLATE',
				templateId,
			} );
		} );
	} );

	describe( 'setTemplatePart', () => {
		it( 'should return the SET_TEMPLATE_PART action', () => {
			const templatePartId = 1;
			expect( setTemplatePart( templatePartId ) ).toEqual( {
				type: 'SET_TEMPLATE_PART',
				templatePartId,
			} );
		} );
	} );

	describe( 'setPage', () => {
		it( 'should yield the FIND_TEMPLATE control and return the SET_TEMPLATE_PART action', () => {
			const page = { path: '/' };
			const templateId = 1;

			const it = setPage( page );
			expect( it.next().value ).toEqual( {
				type: 'FIND_TEMPLATE',
				path: page.path,
			} );
			expect( it.next( templateId ) ).toEqual( {
				value: {
					type: 'SET_PAGE',
					page,
					templateId,
				},
				done: true,
			} );
		} );
	} );
} );
