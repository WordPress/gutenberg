/**
 * Internal dependencies
 */
import {
	getNotificationArgumentsForSaveSuccess,
	getNotificationArgumentsForSaveFail,
	getNotificationArgumentsForTrashFail,
} from '../notice-builder';
import { SAVE_POST_NOTICE_ID, TRASH_POST_NOTICE_ID } from '../../constants';

describe( 'getNotificationArgumentsForSaveSuccess()', () => {
	const postType = {
		labels: {
			item_reverted_to_draft: 'draft',
			item_published: 'publish',
			item_published_privately: 'private',
			item_scheduled: 'scheduled',
			item_updated: 'updated',
			view_item: 'view',
		},
		viewable: false,
	};
	const previousPost = {
		status: 'publish',
		link: 'some_link',
	};
	const post = { ...previousPost };
	const defaultExpectedAction = {
		id: SAVE_POST_NOTICE_ID,
		actions: [],
		type: 'snackbar',
	};
	[
		[
			'when previous post is not published and post will not be published',
			[ 'draft', 'draft', false ],
			[ 'Draft saved', defaultExpectedAction ],
		],
		[
			'when previous post is published and post will be unpublished',
			[ 'publish', 'draft', false ],
			[ 'draft', defaultExpectedAction ],
		],
		[
			'when previous post is not published and post will be published',
			[ 'draft', 'publish', false ],
			[ 'publish', defaultExpectedAction ],
		],
		[
			'when previous post is not published and post will be privately ' +
				'published',
			[ 'draft', 'private', false ],
			[ 'private', defaultExpectedAction ],
		],
		[
			'when previous post is not published and post will be scheduled for ' +
				'publishing',
			[ 'draft', 'future', false ],
			[ 'scheduled', defaultExpectedAction ],
		],
		[
			'when both are considered published',
			[ 'private', 'publish', false ],
			[ 'updated', defaultExpectedAction ],
		],
		[
			'when both are considered published and the post type is viewable',
			[ 'private', 'publish', true ],
			[
				'updated',
				{
					...defaultExpectedAction,
					actions: [ { label: 'view', url: 'some_link' } ],
				},
			],
		],
	].forEach(
		( [
			description,
			[ previousPostStatus, postStatus, isViewable ],
			expectedValue,
		] ) => {
			// eslint-disable-next-line jest/valid-title
			it( description, () => {
				previousPost.status = previousPostStatus;
				post.status = postStatus;
				postType.viewable = isViewable;
				expect(
					getNotificationArgumentsForSaveSuccess( {
						previousPost,
						post,
						postType,
					} )
				).toEqual( expectedValue );
			} );
		}
	);
} );
describe( 'getNotificationArgumentsForSaveFail()', () => {
	const error = { code: '42', message: 'Something went wrong.' };
	const post = { status: 'publish' };
	const edits = { status: 'publish' };
	const defaultExpectedAction = { id: SAVE_POST_NOTICE_ID };
	[
		[
			'when error code is `rest_autosave_no_changes`',
			'rest_autosave_no_changes',
			[ 'publish', 'publish' ],
			[],
		],
		[
			'when post is not published and edits is published',
			'',
			[ 'draft', 'publish' ],
			[
				'Publishing failed. Something went wrong.',
				defaultExpectedAction,
			],
		],
		[
			'when post is published and edits is privately published',
			'',
			[ 'draft', 'private' ],
			[
				'Publishing failed. Something went wrong.',
				defaultExpectedAction,
			],
		],
		[
			'when post is published and edits is scheduled to be published',
			'',
			[ 'draft', 'future' ],
			[
				'Scheduling failed. Something went wrong.',
				defaultExpectedAction,
			],
		],
		[
			'when post is published and edits is published',
			'',
			[ 'publish', 'publish' ],
			[ 'Updating failed. Something went wrong.', defaultExpectedAction ],
		],
	].forEach(
		( [
			description,
			errorCode,
			[ postStatus, editsStatus ],
			expectedValue,
		] ) => {
			// eslint-disable-next-line jest/valid-title
			it( description, () => {
				post.status = postStatus;
				error.code = errorCode;
				edits.status = editsStatus;
				expect(
					getNotificationArgumentsForSaveFail( {
						post,
						edits,
						error,
					} )
				).toEqual( expectedValue );
			} );
		}
	);
} );
describe( 'getNotificationArgumentsForTrashFail()', () => {
	[
		[
			'when there is an error message and the error code is not "unknown_error"',
			{ message: 'foo', code: '' },
			'foo',
		],
		[
			'when there is an error message and the error code is "unknown error"',
			{ message: 'foo', code: 'unknown_error' },
			'Trashing failed',
		],
		[
			'when there is not an error message',
			{ code: 42 },
			'Trashing failed',
		],
	].forEach( ( [ description, error, message ] ) => {
		// eslint-disable-next-line jest/valid-title
		it( description, () => {
			const expectedValue = [ message, { id: TRASH_POST_NOTICE_ID } ];
			expect( getNotificationArgumentsForTrashFail( { error } ) ).toEqual(
				expectedValue
			);
		} );
	} );
} );
