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
	removeAllNotices,
	removeNotices,
} from '../actions';
import { DEFAULT_CONTEXT, DEFAULT_STATUS } from '../constants';

describe( 'actions', () => {
	describe( 'createNotice', () => {
		const id = 'my-id';
		const status = 'status';
		const content = 'my message';

		it( 'returns an action when options is empty', () => {
			const result = createNotice( status, content );

			expect( result ).toMatchObject( {
				type: 'CREATE_NOTICE',
				context: DEFAULT_CONTEXT,
				notice: {
					status,
					content,
					isDismissible: true,
					id: expect.any( String ),
					actions: [],
					type: 'default',
				},
			} );
		} );

		it( 'normalizes content to string', () => {
			const result = createNotice( status, <strong>Hello</strong> );

			expect( result ).toMatchObject( {
				type: 'CREATE_NOTICE',
				context: DEFAULT_CONTEXT,
				notice: {
					status,
					content: expect.any( String ),
					isDismissible: true,
					id: expect.any( String ),
					actions: [],
					type: 'default',
				},
			} );
		} );

		it( 'returns an action when options passed', () => {
			const context = 'foo';
			const options = {
				id,
				isDismissible: false,
				context: 'foo',
				icon: '🌮',
			};

			const result = createNotice( status, content, options );

			expect( result ).toEqual( {
				type: 'CREATE_NOTICE',
				context,
				notice: {
					id,
					status,
					content,
					spokenMessage: content,
					__unstableHTML: undefined,
					isDismissible: false,
					actions: [],
					type: 'default',
					icon: '🌮',
					explicitDismiss: false,
					onDismiss: undefined,
				},
			} );
		} );

		it( 'returns an action when speak disabled', () => {
			const result = createNotice(
				undefined,
				'my <strong>message</strong>',
				{
					id,
					__unstableHTML: true,
					isDismissible: false,
					speak: false,
				}
			);

			expect( result ).toEqual( {
				type: 'CREATE_NOTICE',
				context: DEFAULT_CONTEXT,
				notice: {
					id,
					status: DEFAULT_STATUS,
					content: 'my <strong>message</strong>',
					spokenMessage: null,
					__unstableHTML: true,
					isDismissible: false,
					actions: [],
					type: 'default',
					icon: null,
					explicitDismiss: false,
					onDismiss: undefined,
				},
			} );
		} );
	} );

	describe( 'createSuccessNotice', () => {
		it( 'should return action', () => {
			const content = 'my message';

			const result = createSuccessNotice( content );

			expect( result ).toMatchObject( {
				type: 'CREATE_NOTICE',
				context: DEFAULT_CONTEXT,
				notice: {
					status: 'success',
					content,
					isDismissible: true,
					id: expect.any( String ),
					type: 'default',
				},
			} );
		} );
	} );

	describe( 'createInfoNotice', () => {
		it( 'should return action', () => {
			const content = 'my message';

			const result = createInfoNotice( content );

			expect( result ).toMatchObject( {
				type: 'CREATE_NOTICE',
				context: DEFAULT_CONTEXT,
				notice: {
					status: DEFAULT_STATUS,
					content,
					isDismissible: true,
					id: expect.any( String ),
					type: 'default',
				},
			} );
		} );
	} );

	describe( 'createErrorNotice', () => {
		it( 'should return action', () => {
			const content = 'my message';

			const result = createErrorNotice( content );

			expect( result ).toMatchObject( {
				type: 'CREATE_NOTICE',
				context: DEFAULT_CONTEXT,
				notice: {
					status: 'error',
					content,
					isDismissible: true,
					id: expect.any( String ),
					type: 'default',
				},
			} );
		} );
	} );

	describe( 'createWarningNotice', () => {
		it( 'should return action', () => {
			const content = 'my message';

			const result = createWarningNotice( content );

			expect( result ).toMatchObject( {
				type: 'CREATE_NOTICE',
				context: DEFAULT_CONTEXT,
				notice: {
					status: 'warning',
					content,
					isDismissible: true,
					id: expect.any( String ),
					type: 'default',
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

	describe( 'removeNotices', () => {
		it( 'should return action', () => {
			const ids = [ 'id', 'id2' ];

			expect( removeNotices( ids ) ).toEqual( {
				type: 'REMOVE_NOTICES',
				ids,
				context: DEFAULT_CONTEXT,
			} );
		} );

		it( 'should return action with custom context', () => {
			const ids = [ 'id', 'id2' ];
			const context = 'foo';

			expect( removeNotices( ids, context ) ).toEqual( {
				type: 'REMOVE_NOTICES',
				ids,
				context,
			} );
		} );
	} );

	describe( 'removeAllNotices', () => {
		it( 'should return action', () => {
			expect( removeAllNotices() ).toEqual( {
				type: 'REMOVE_ALL_NOTICES',
				noticeType: 'default',
				context: DEFAULT_CONTEXT,
			} );
		} );

		it( 'should return action with custom context', () => {
			const context = 'foo';

			expect( removeAllNotices( 'default', context ) ).toEqual( {
				type: 'REMOVE_ALL_NOTICES',
				noticeType: 'default',
				context,
			} );
		} );

		it( 'should return action with type', () => {
			expect( removeAllNotices( 'snackbar' ) ).toEqual( {
				type: 'REMOVE_ALL_NOTICES',
				noticeType: 'snackbar',
				context: DEFAULT_CONTEXT,
			} );
		} );
	} );
} );
