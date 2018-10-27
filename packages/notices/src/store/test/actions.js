/**
 * Internal dependencies
 */
import {
	createNotice,
	createSuccessNotice,
	createInfoNotice,
	createErrorNotice,
	createWarningNotice,
	removeNotice,
} from '../actions';
import { DEFAULT_CONTEXT } from '../constants';

describe( 'actions', () => {
	describe( 'createNotice', () => {
		const status = 'status';
		const content = 'my message';

		it( 'should yields actions when options is empty', () => {
			const result = createNotice( status, content );

			expect( result.next().value ).toMatchObject( {
				type: 'SPEAK',
				message: content,
			} );

			expect( result.next().value ).toMatchObject( {
				type: 'CREATE_NOTICE',
				context: DEFAULT_CONTEXT,
				notice: {
					status,
					content,
					isDismissible: true,
					id: expect.any( String ),
					actions: [],
				},
			} );
		} );

		it( 'should yields actions when options passed', () => {
			const id = 'my-id';
			const context = 'foo';
			const options = {
				id,
				isDismissible: false,
				context: 'foo',
			};

			const result = createNotice( status, content, options );

			expect( result.next().value ).toMatchObject( {
				type: 'SPEAK',
				message: content,
			} );

			expect( result.next().value ).toEqual( {
				type: 'CREATE_NOTICE',
				context,
				notice: {
					id,
					status,
					content,
					isDismissible: false,
					actions: [],
				},
			} );
		} );
	} );

	describe( 'createSuccessNotice', () => {
		it( 'should return action', () => {
			const content = 'my message';

			const result = createSuccessNotice( content );

			expect( result.next().value ).toMatchObject( {
				type: 'SPEAK',
				message: content,
			} );

			expect( result.next().value ).toMatchObject( {
				type: 'CREATE_NOTICE',
				context: DEFAULT_CONTEXT,
				notice: {
					status: 'success',
					content,
					isDismissible: true,
					id: expect.any( String ),
				},
			} );
		} );
	} );

	describe( 'createInfoNotice', () => {
		it( 'should return action', () => {
			const content = 'my message';

			const result = createInfoNotice( content );

			expect( result.next().value ).toMatchObject( {
				type: 'SPEAK',
				message: content,
			} );

			expect( result.next().value ).toMatchObject( {
				type: 'CREATE_NOTICE',
				context: DEFAULT_CONTEXT,
				notice: {
					status: 'info',
					content,
					isDismissible: true,
					id: expect.any( String ),
				},
			} );
		} );
	} );

	describe( 'createErrorNotice', () => {
		it( 'should return action', () => {
			const content = 'my message';

			const result = createErrorNotice( content );

			expect( result.next().value ).toMatchObject( {
				type: 'SPEAK',
				message: content,
			} );

			expect( result.next().value ).toMatchObject( {
				type: 'CREATE_NOTICE',
				context: DEFAULT_CONTEXT,
				notice: {
					status: 'error',
					content,
					isDismissible: true,
					id: expect.any( String ),
				},
			} );
		} );
	} );

	describe( 'createWarningNotice', () => {
		it( 'should return action', () => {
			const content = 'my message';

			const result = createWarningNotice( content );

			expect( result.next().value ).toMatchObject( {
				type: 'SPEAK',
				message: content,
			} );

			expect( result.next().value ).toMatchObject( {
				type: 'CREATE_NOTICE',
				context: DEFAULT_CONTEXT,
				notice: {
					status: 'warning',
					content,
					isDismissible: true,
					id: expect.any( String ),
				},
			} );
		} );
	} );

	describe( 'removeNotice', () => {
		it( 'should return action', () => {
			const id = 'id';

			expect( removeNotice( id ) ).toEqual( {
				type: 'REMOVE_NOTICE',
				id,
				context: DEFAULT_CONTEXT,
			} );
		} );

		it( 'should return action with custom context', () => {
			const id = 'id';
			const context = 'foo';

			expect( removeNotice( id, context ) ).toEqual( {
				type: 'REMOVE_NOTICE',
				id,
				context,
			} );
		} );
	} );
} );
