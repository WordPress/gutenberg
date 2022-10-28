/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

type SiteSettings = {
	title: string;
	description: string;
	url: string;
	email: string;
	timezone: string;
	date_format: string;
	time_format: string;
	start_of_week: number;
	language: string;
	use_smilies: boolean;
	default_category: number;
	default_post_format: string;
	posts_per_page: number;
	default_ping_status: 'open' | 'closed';
	default_comment_status: 'open' | 'closed';
};

/**
 * Get the site settings.
 *
 * @see https://developer.wordpress.org/rest-api/reference/settings/#retrieve-a-site-setting
 *
 * @param  this RequestUtils.
 */
export async function getSiteSettings( this: RequestUtils ) {
	return await this.rest< SiteSettings >( {
		path: '/wp/v2/settings',
		method: 'GET',
	} );
}

/**
 * Update the site settings.
 *
 * @see https://developer.wordpress.org/rest-api/reference/settings/#update-a-site-setting
 *
 * @param  this         RequestUtils.
 * @param  siteSettings The partial settings payload to update.
 */
export async function updateSiteSettings(
	this: RequestUtils,
	siteSettings: Partial< SiteSettings >
) {
	return await this.rest< SiteSettings >( {
		path: '/wp/v2/settings',
		method: 'POST',
		data: siteSettings,
	} );
}
