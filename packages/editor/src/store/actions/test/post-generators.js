/**
 * Internal dependencies.
 */
import actions, {
	savePost,
	autosave,
	trashPost,
	refreshPost,
} from '../post-generators';
import { select, dispatch, apiFetch } from '../../controls';
import {
	MODULE_KEY,
	SAVE_POST_NOTICE_ID,
	TRASH_POST_NOTICE_ID,
} from '../../constants';

jest.mock( '../../controls' );

select.mockImplementation( ( ...args ) => {
	const { select: actualSelect } = jest.requireActual( '../../controls' );
	return actualSelect( ...args );
} );

dispatch.mockImplementation( ( ...args ) => {
	const { dispatch: actualDispatch } = jest.requireActual( '../../controls' );
	return actualDispatch( ...args );
} );

const apiFetchThrowError = ( error ) => {
	apiFetch.mockClear();
	apiFetch.mockImplementation( () => {
		throw error;
	} );
};

const apiFetchDoActual = () => {
	apiFetch.mockClear();
	apiFetch.mockImplementation( ( ...args ) => {
		const { apiFetch: fetch } = jest.requireActual( '../../controls' );
		return fetch( ...args );
	} );
};

const postType = {
	rest_base: 'posts',
	labels: {
		item_updated: 'Updated Post',
		item_published: 'Post published',
	},
};
const postTypeSlug = 'post';

describe( 'Post generator actions', () => {
	describe( 'savePost()', () => {
		let fulfillment,
			edits,
			currentPost,
			currentPostStatus,
			editPostToSendOptimistic,
			autoSavePost,
			autoSavePostToSend,
			savedPost,
			savedPostStatus,
			isAutosave,
			isEditedPostNew,
			savedPostMessage;
		beforeEach( () => {
			edits = ( defaultStatus = null ) => {
				const postObject = {
					title: 'foo',
					content: 'bar',
					excerpt: 'cheese',
					foo: 'bar',
				};
				if ( defaultStatus !== null ) {
					postObject.status = defaultStatus;
				}
				return postObject;
			};
			currentPost = () => ( {
				id: 44,
				title: 'bar',
				content: 'bar',
				excerpt: 'crackers',
				status: currentPostStatus,
			} );
			editPostToSendOptimistic = () => {
				const postObject = {
					...edits(),
					content: editedPostContent,
					id: currentPost().id,
				};
				if ( ! postObject.status && isEditedPostNew ) {
					postObject.status = 'draft';
				}
				if ( isAutosave ) {
					delete postObject.foo;
				}
				return postObject;
			};
			autoSavePost = { status: 'autosave', bar: 'foo' };
			autoSavePostToSend = () => (
				{
					...editPostToSendOptimistic(),
					bar: 'foo',
					status: 'autosave',
				}
			);
			savedPost = () => (
				{
					...currentPost(),
					...editPostToSendOptimistic(),
					content: editedPostContent,
					status: savedPostStatus,
				}
			);
		} );
		const editedPostContent = 'to infinity and beyond';
		const reset = ( isAutosaving ) => fulfillment = savePost(
			{ isAutosave: isAutosaving }
		);
		const rewind = ( isAutosaving, isNewPost ) => {
			reset( isAutosaving );
			fulfillment.next();
			fulfillment.next( true );
			fulfillment.next( edits() );
			fulfillment.next( isNewPost );
			fulfillment.next( currentPost() );
			fulfillment.next( editedPostContent );
			fulfillment.next( postTypeSlug );
			fulfillment.next( postType );
			fulfillment.next();
			if ( isAutosaving ) {
				fulfillment.next();
			} else {
				fulfillment.next();
				fulfillment.next();
			}
		};
		const initialTestConditions = [
			[
				'yields action for selecting if edited post is saveable',
				() => true,
				() => {
					reset( isAutosave );
					const { value } = fulfillment.next();
					expect( value ).toEqual(
						select( MODULE_KEY, 'isEditedPostSaveable' )
					);
				},
			],
			[
				'yields action for selecting the post edits done',
				() => true,
				() => {
					const { value } = fulfillment.next( true );
					expect( value ).toEqual(
						select( MODULE_KEY, 'getPostEdits' )
					);
				},
			],
			[
				'yields action for selecting whether the edited post is new',
				() => true,
				() => {
					const { value } = fulfillment.next( edits() );
					expect( value ).toEqual(
						select( MODULE_KEY, 'isEditedPostNew' )
					);
				},
			],
			[
				'yields action for selecting the current post',
				() => true,
				() => {
					const { value } = fulfillment.next( isEditedPostNew );
					expect( value ).toEqual(
						select( MODULE_KEY, 'getCurrentPost' )
					);
				},
			],
			[
				'yields action for selecting the edited post content',
				() => true,
				() => {
					const { value } = fulfillment.next( currentPost() );
					expect( value ).toEqual(
						select( MODULE_KEY, 'getEditedPostContent' )
					);
				},
			],
			[
				'yields action for selecting current post type slug',
				() => true,
				() => {
					const { value } = fulfillment.next( editedPostContent );
					expect( value ).toEqual(
						select( MODULE_KEY, 'getCurrentPostType' )
					);
				},
			],
			[
				'yields action for selecting the post type object',
				() => true,
				() => {
					const { value } = fulfillment.next( postTypeSlug );
					expect( value ).toEqual(
						select( 'core', 'getPostType', postTypeSlug )
					);
				},
			],
			[
				'yields action for dispatching request post update start',
				() => true,
				() => {
					const { value } = fulfillment.next( postType );
					expect( value ).toEqual(
						dispatch(
							MODULE_KEY,
							'__experimentalRequestPostUpdateStart',
							{ isAutosave }
						)
					);
				},
			],
			[
				'yields action for dispatching optimistic update of post',
				() => true,
				() => {
					const { value } = fulfillment.next();
					expect( value ).toEqual(
						dispatch(
							MODULE_KEY,
							'__experimentalOptimisticUpdatePost',
							editPostToSendOptimistic()
						)
					);
				},
			],
			[
				'yields action for dispatching the removal of save post notice',
				( isAutosaving ) => ! isAutosaving,
				() => {
					const { value } = fulfillment.next();
					expect( value ).toEqual(
						dispatch(
							'core/notices',
							'removeNotice',
							SAVE_POST_NOTICE_ID,
						)
					);
				},
			],
			[
				'yields action for dispatching the removal of autosave notice',
				( isAutosaving ) => ! isAutosaving,
				() => {
					const { value } = fulfillment.next();
					expect( value ).toEqual(
						dispatch(
							'core/notices',
							'removeNotice',
							'autosave-exists'
						)
					);
				},
			],
			[
				'yield action for selecting the autoSavePost',
				( isAutosaving ) => isAutosaving,
				() => {
					const { value } = fulfillment.next();
					expect( value ).toEqual(
						select(
							MODULE_KEY,
							'getAutosave'
						)
					);
				},
			],
		];
		const fetchErrorConditions = [
			[
				'yields action for dispatching post update failure',
				() => {
					const error = { foo: 'bar', code: 'fail' };
					apiFetchThrowError( error );
					const editsObject = edits();
					const { value } = isAutosave ?
						fulfillment.next( autoSavePost ) :
						fulfillment.next();
					if ( isAutosave ) {
						delete editsObject.foo;
					}
					expect( value ).toEqual(
						dispatch(
							MODULE_KEY,
							'__experimentalRequestPostUpdateFailure',
							{
								post: currentPost(),
								edits: isEditedPostNew ?
									{ ...editsObject, status: 'draft' } :
									editsObject,
								error,
								options: { isAutosave },
							}
						)
					);
				},
			],
			[
				'yields action for dispatching an appropriate error notice',
				() => {
					const { value } = fulfillment.next( [ 'foo', 'bar' ] );
					expect( value ).toEqual(
						dispatch(
							'core/notices',
							'createErrorNotice',
							...[ 'Updating failed', { id: 'SAVE_POST_NOTICE_ID' } ]
						)
					);
				},
			],
		];
		const fetchSuccessConditions = [
			[
				'yields action for updating the post via the api',
				() => {
					apiFetchDoActual();
					rewind( isAutosave, isEditedPostNew );
					const { value } = isAutosave ?
						fulfillment.next( autoSavePost ) :
						fulfillment.next();
					const data = isAutosave ?
						autoSavePostToSend() :
						editPostToSendOptimistic();
					const path = isAutosave ? '/autosaves' : '';
					expect( value ).toEqual(
						apiFetch(
							{
								path: `/wp/v2/${ postType.rest_base }/${ editPostToSendOptimistic().id }${ path }`,
								method: 'PUT',
								data,
							}
						)
					);
				},
			],
			[
				'yields action for dispatch the appropriate reset action',
				() => {
					const { value } = fulfillment.next( savedPost() );
					expect( value ).toEqual(
						dispatch(
							MODULE_KEY,
							isAutosave ? 'resetAutosave' : 'resetPost',
							savedPost()
						)
					);
				},
			],
			[
				'yields action for dispatching the post update success',
				() => {
					const { value } = fulfillment.next();
					expect( value ).toEqual(
						dispatch(
							MODULE_KEY,
							'__experimentalRequestPostUpdateSuccess',
							{
								previousPost: currentPost(),
								post: savedPost(),
								options: { isAutosave },
								postType,
								isRevision: false,
							}
						)
					);
				},
			],
			[
				'yields dispatch action for success notification',
				() => {
					const { value } = fulfillment.next( [ 'foo', 'bar' ] );
					const expected = isAutosave ?
						undefined :
						dispatch(
							'core/notices',
							'createSuccessNotice',
							...[
								savedPostMessage,
								{ actions: [], id: 'SAVE_POST_NOTICE_ID' },
							]
						);
					expect( value ).toEqual( expected );
				},
			],
		];

		const conditionalRunTestRoutine = ( isAutosaving ) => ( [
			testDescription,
			shouldRun,
			testRoutine,
		] ) => {
			if ( shouldRun( isAutosaving ) ) {
				it( testDescription, () => {
					testRoutine();
				} );
			}
		};

		const testRunRoutine = ( [ testDescription, testRoutine ] ) => {
			it( testDescription, () => {
				testRoutine();
			} );
		};

		describe( 'yields with expected responses when edited post is not ' +
			'saveable', () => {
			it( 'yields action for selecting if edited post is saveable', () => {
				reset( false );
				const { value } = fulfillment.next();
				expect( value ).toEqual(
					select( MODULE_KEY, 'isEditedPostSaveable' )
				);
			} );
			it( 'if edited post is not saveable then bails', () => {
				const { value, done } = fulfillment.next( false );
				expect( done ).toBe( true );
				expect( value ).toBeUndefined();
			} );
		} );
		describe( 'yields with expected responses for when not autosaving ' +
			'and edited post is new', () => {
			beforeEach( () => {
				isAutosave = false;
				isEditedPostNew = true;
				savedPostStatus = 'publish';
				currentPostStatus = 'draft';
				savedPostMessage = 'Post published';
			} );
			initialTestConditions.forEach( conditionalRunTestRoutine( false ) );
			describe( 'fetch action throwing an error', () => {
				fetchErrorConditions.forEach( testRunRoutine );
			} );
			describe( 'fetch action not throwing an error', () => {
				fetchSuccessConditions.forEach( testRunRoutine );
			} );
		} );

		describe( 'yields with expected responses for when not autosaving ' +
			'and edited post is not new', () => {
			beforeEach( () => {
				isAutosave = false;
				isEditedPostNew = false;
				currentPostStatus = 'publish';
				savedPostStatus = 'publish';
				savedPostMessage = 'Updated Post';
			} );
			initialTestConditions.forEach( conditionalRunTestRoutine( false ) );
			describe( 'fetch action throwing error', () => {
				fetchErrorConditions.forEach( testRunRoutine );
			} );
			describe( 'fetch action not throwing error', () => {
				fetchSuccessConditions.forEach( testRunRoutine );
			} );
		} );
		describe( 'yields with expected responses for when autosaving is true ' +
			'and edited post is not new', () => {
			beforeEach( () => {
				isAutosave = true;
				isEditedPostNew = false;
				currentPostStatus = 'autosave';
				savedPostStatus = 'publish';
				savedPostMessage = 'Post published';
			} );
			initialTestConditions.forEach( conditionalRunTestRoutine( true ) );
			describe( 'fetch action throwing error', () => {
				fetchErrorConditions.forEach( testRunRoutine );
			} );
			describe( 'fetch action not throwing error', () => {
				fetchSuccessConditions.forEach( testRunRoutine );
			} );
		} );
	} );
} );
describe( 'autosave()', () => {
	let savePostSpy;
	beforeAll( () => savePostSpy = jest.spyOn( actions, 'savePost' ) );
	afterAll( () => savePostSpy.mockRestore() );
	// autosave is mostly covered by `savePost` tests so just test the correct call
	it( 'calls savePost with the correct arguments', () => {
		const fulfillment = autosave();
		fulfillment.next();
		expect( savePostSpy ).toHaveBeenCalled();
		expect( savePostSpy ).toHaveBeenCalledWith( { isAutosave: true } );
	} );
} );
describe( 'trashPost()', () => {
	let fulfillment;
	const currentPost = { id: 10, content: 'foo', status: 'publish' };
	const reset = () => fulfillment = trashPost();
	const rewind = () => {
		reset();
		fulfillment.next();
		fulfillment.next( postTypeSlug );
		fulfillment.next( postType );
		fulfillment.next();
	};
	it( 'yields expected action for selecting the current post type slug', () => {
		reset();
		const { value } = fulfillment.next();
		expect( value ).toEqual( select(
			MODULE_KEY,
			'getCurrentPostType',
		) );
	} );
	it( 'yields expected action for selecting the post type object', () => {
		const { value } = fulfillment.next( postTypeSlug );
		expect( value ).toEqual( select(
			'core',
			'getPostType',
			postTypeSlug
		) );
	} );
	it( 'yields expected action for dispatching removing the trash notice ' +
		'for the post', () => {
		const { value } = fulfillment.next( postType );
		expect( value ).toEqual( dispatch(
			'core/notices',
			'removeNotice',
			TRASH_POST_NOTICE_ID
		) );
	} );
	it( 'yields expected action for selecting the currentPost', () => {
		const { value } = fulfillment.next();
		expect( value ).toEqual( select(
			MODULE_KEY,
			'getCurrentPost'
		) );
	} );
	describe( 'expected yields when fetch throws an error', () => {
		it( 'yields expected action for dispatching an error notice', () => {
			const error = { foo: 'bar', code: 'fail' };
			apiFetchThrowError( error );
			const { value } = fulfillment.next( currentPost );
			expect( value ).toEqual( dispatch(
				'core/notices',
				'createErrorNotice',
				'Trashing failed',
				{ id: TRASH_POST_NOTICE_ID },
			) );
		} );
	} );
	describe( 'expected yields when fetch does not throw an error', () => {
		it( 'yields expected action object for the api fetch', () => {
			apiFetchDoActual();
			rewind();
			const { value } = fulfillment.next( currentPost );
			expect( value ).toEqual( apiFetch(
				{
					path: `/wp/v2/${ postType.rest_base }/${ currentPost.id }`,
					method: 'DELETE',
				}
			) );
		} );
		it( 'yields expected dispatch action for resetting the post', () => {
			const { value } = fulfillment.next();
			expect( value ).toEqual( dispatch(
				MODULE_KEY,
				'resetPost',
				{ ...currentPost, status: 'trash' }
			) );
		} );
	} );
} );
describe( 'refreshPost()', () => {
	let fulfillment;
	const currentPost = { id: 10, content: 'foo' };
	const reset = () => fulfillment = refreshPost();
	it( 'yields expected action for selecting the currentPost', () => {
		reset();
		const { value } = fulfillment.next();
		expect( value ).toEqual( select(
			MODULE_KEY,
			'getCurrentPost',
		) );
	} );
	it( 'yields expected action for selecting the current post type', () => {
		const { value } = fulfillment.next( currentPost );
		expect( value ).toEqual( select(
			MODULE_KEY,
			'getCurrentPostType'
		) );
	} );
	it( 'yields expected action for selecting the post type object', () => {
		const { value } = fulfillment.next( postTypeSlug );
		expect( value ).toEqual( select(
			'core',
			'getPostType',
			postTypeSlug
		) );
	} );
	it( 'yields expected action for the api fetch call', () => {
		const { value } = fulfillment.next( postType );
		apiFetchDoActual();
		// since the timestamp is a computed value we can't do a direct comparison.
		// so we'll just see if the path has most of the value.
		expect( value.request.path ).toEqual( expect.stringContaining(
			`/wp/v2/${ postType.rest_base }/${ currentPost.id }?context=edit&_timestamp=`
		) );
	} );
	it( 'yields expected action for dispatching the reset of the post', () => {
		const { value } = fulfillment.next( currentPost );
		expect( value ).toEqual( dispatch(
			MODULE_KEY,
			'resetPost',
			currentPost
		) );
	} );
} );
