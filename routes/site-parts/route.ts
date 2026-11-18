import { __ } from '@wordpress/i18n';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { notFound } from '@wordpress/route';
import { unlock } from '@wordpress/routes-lock-unlock';

const { resolveSitePartsUsage } = unlock( editorPrivateApis );

declare global {
	interface Window {
		__experimentalSiteParts?: boolean;
	}
}

/**
 * Site parts is behind the "Site parts" experiment.
 */
function assertEnabled() {
	if ( ! window?.__experimentalSiteParts ) {
		throw notFound();
	}
}

/**
 * Route configuration for the site parts list.
 */
export const route = {
	beforeLoad: assertEnabled,
	title: () => __( 'Site parts' ),
	async canvas() {
		return {
			isPreview: true,
			// Show the homepage, where the site parts listed here appear.
			renderingMode: 'template-locked' as const,
		};
	},
	loader: async () => {
		// The stage lists the primary part in each area, so work them out
		// before it mounts.
		await resolveSitePartsUsage();
	},
};
