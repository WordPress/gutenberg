import {
	test as base,
	expect,
	type RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';
import { setCollaboration } from './fixtures/collaboration-utils';

type CreatedPost = {
	id: number;
};

type EditablePost = {
	title: { raw: string };
};

type Fixtures = {
	collaborationEnabled: boolean;
};

const POST_TYPE_REST_BASE = 'rtc_disabled';

async function autosavePost(
	requestUtils: RequestUtils,
	postId: number,
	title: string,
	status: 'draft' | 'publish'
): Promise< { savedPost: EditablePost; autosaves: EditablePost[] } > {
	await requestUtils.rest( {
		method: 'POST',
		path: `/wp/v2/${ POST_TYPE_REST_BASE }/${ postId }/autosaves`,
		data: { title, status },
	} );

	const [ savedPost, autosaves ] = await Promise.all( [
		requestUtils.rest< EditablePost >( {
			path: `/wp/v2/${ POST_TYPE_REST_BASE }/${ postId }`,
			params: { context: 'edit' },
		} ),
		requestUtils.rest< EditablePost[] >( {
			path: `/wp/v2/${ POST_TYPE_REST_BASE }/${ postId }/autosaves`,
			params: { context: 'edit' },
		} ),
	] );

	return { savedPost, autosaves };
}

// This test only needs collaboration enabled, not a second user.
const test = base.extend< Fixtures >( {
	collaborationEnabled: [
		async ( { requestUtils }, use ) => {
			await setCollaboration( requestUtils, true );
			try {
				await use( true );
			} finally {
				await setCollaboration( requestUtils, false );
			}
		},
		{ auto: true },
	],
} );

test.describe( 'Collaboration - disabled post type autosaves', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-custom-post-types' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts( POST_TYPE_REST_BASE );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-custom-post-types'
		);
	} );

	test( 'updates a draft directly using Core autosave behavior when collaboration is disabled for the post type', async ( {
		requestUtils,
	} ) => {
		const post = await requestUtils.createRecord< CreatedPost >(
			POST_TYPE_REST_BASE,
			{
				title: 'Original title',
				status: 'draft',
				date_gmt: new Date().toISOString(),
			}
		);
		const updatedTitle = 'Updated title';

		const { savedPost, autosaves } = await autosavePost(
			requestUtils,
			post.id,
			updatedTitle,
			'draft'
		);

		expect( savedPost.title.raw ).toBe( updatedTitle );
		expect( autosaves ).toHaveLength( 0 );
	} );

	test( 'creates a Core autosave revision for a published post when collaboration is disabled for the post type', async ( {
		requestUtils,
	} ) => {
		const originalTitle = 'Published title';
		const post = await requestUtils.createRecord< CreatedPost >(
			POST_TYPE_REST_BASE,
			{
				title: originalTitle,
				status: 'publish',
				date_gmt: new Date().toISOString(),
			}
		);
		const updatedTitle = 'Autosaved title';

		const { savedPost, autosaves } = await autosavePost(
			requestUtils,
			post.id,
			updatedTitle,
			'publish'
		);

		expect( savedPost.title.raw ).toBe( originalTitle );
		expect( autosaves ).toHaveLength( 1 );
		expect( autosaves[ 0 ].title.raw ).toBe( updatedTitle );
	} );
} );
