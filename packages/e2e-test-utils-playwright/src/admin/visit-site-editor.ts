/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import type { Admin } from './';

export interface SiteEditorQueryParams {
	postId: string | number;
	postType: string;
}

const CANVAS_SELECTOR = 'iframe[title="Editor canvas"i]';

/**
 * Visits the Site Editor main page
 *
 * By default, it also skips the welcome guide. The option can be disabled if need be.
 *
 * @param this
 * @param query            Query params to be serialized as query portion of URL.
 * @param skipWelcomeGuide Whether to skip the welcome guide as part of the navigation.
 */
export async function visitSiteEditor(
	this: Admin,
	query: SiteEditorQueryParams,
	skipWelcomeGuide = true
) {
	const path = addQueryArgs( '', {
		...query,
	} ).slice( 1 );

	await this.visitAdminPage( 'site-editor.php', path );

	if ( skipWelcomeGuide ) {
		await this.page.evaluate( () => {
			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-site', 'welcomeGuide', false );

			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-site', 'welcomeGuideStyles', false );

			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-site', 'welcomeGuidePage', false );

			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-site', 'welcomeGuideTemplate', false );
		} );
	}

	// The site editor initially loads with an empty body,
	// we need to wait for the editor canvas to be rendered.
	await this.page
		.frameLocator( CANVAS_SELECTOR )
		.locator( 'body > *' )
		.first()
		.waitFor();

	// TODO: Ideally the content underneath the spinner should be marked inert until it's ready.
	await this.page
		.locator( '.edit-site-canvas-spinner' )
		.waitFor( { state: 'hidden' } );
}
