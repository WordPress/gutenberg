/**
 * WordPress dependencies
 */
import type { RequestUtils } from '@wordpress/e2e-test-utils-playwright';

export default class InteractivityUtils {
	posts: Map< string, number >;
	requestUtils: RequestUtils;

	constructor( { requestUtils }: { requestUtils: RequestUtils } ) {
		this.posts = new Map();
		this.requestUtils = requestUtils;
	}

	async addPostWithBlock( blockName: string ) {
		const payload = {
			content: `<!-- wp:${ blockName } /-->`,
			status: 'publish' as 'publish',
			date_gmt: '2023-01-01T00:00:00',
		};

		const { id } = await this.requestUtils.createPost( payload );
		this.posts.set( blockName, id );
	}

	async deleteAllPosts() {
		await this.requestUtils.deleteAllPosts();
		this.posts.clear();
	}

	async activatePlugins() {
		await this.requestUtils.activateTheme( 'emptytheme' );
		await this.requestUtils.activatePlugin(
			'gutenberg-test-interactive-blocks'
		);
	}

	async deactivatePlugins() {
		await this.requestUtils.activateTheme( 'twentytwentyone' );
		await this.requestUtils.deactivatePlugin(
			'gutenberg-test-interactive-blocks'
		);
	}
}
