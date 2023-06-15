/**
 * WordPress dependencies
 */
import type { RequestUtils } from '@wordpress/e2e-test-utils-playwright';

export default class InteractivityUtils {
	links: Map< string, string >;
	requestUtils: RequestUtils;

	constructor( { requestUtils }: { requestUtils: RequestUtils } ) {
		this.links = new Map();
		this.requestUtils = requestUtils;
	}

	getLink( blockName: string ) {
		const link = this.links.get( blockName );
		if ( ! link ) {
			throw new Error(
				`No link found for post with block '${ blockName }'`
			);
		}

		// Add an extra param to disable directives SSR. This is required at
		// this moment, as SSR for directives is not stabilized yet and we need
		// to ensure hydration works, even when the SSR'ed HTML is not correct.
		const url = new URL( link );
		url.searchParams.append( 'disable_directives_ssr', 'true' );
		return url.href;
	}

	async addPostWithBlock( blockName: string ) {
		const payload = {
			content: `<!-- wp:${ blockName } /-->`,
			status: 'publish' as 'publish',
			date_gmt: '2023-01-01T00:00:00',
		};

		const { link } = await this.requestUtils.createPost( payload );
		this.links.set( blockName, link );
	}

	async deleteAllPosts() {
		await this.requestUtils.deleteAllPosts();
		this.links.clear();
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
