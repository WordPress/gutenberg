import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { notFound } from '@wordpress/route';
import { unlock } from '@wordpress/routes-lock-unlock';

const { getSitePartArea, resolveSitePartsUsage } = unlock( editorPrivateApis );

type SitePartParams = { area: string };

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

function getArea( params: SitePartParams ) {
	const area = getSitePartArea( params.area );
	if ( ! area ) {
		throw notFound();
	}
	return area;
}

/**
 * Route configuration for one site part area, such as the header: the part
 * the homepage uses, with panels for what it holds. The `panel` search
 * parameter opens one of those panels.
 */
export const route = {
	beforeLoad: ( { params }: { params: SitePartParams } ) => {
		assertEnabled();
		getArea( params );
	},
	title: ( { params }: { params: SitePartParams } ) =>
		getArea( params ).label,
	async canvas( { params }: { params: SitePartParams } ) {
		const usage = await resolveSitePartsUsage();
		const partId = usage.primary[ params.area ];
		if ( ! partId ) {
			// Without a part to edit, show the homepage the area is missing
			// from.
			return {
				isPreview: true,
				renderingMode: 'template-locked' as const,
			};
		}
		// A preview keeps the stage, and its panels, beside the part.
		// Selecting the canvas opens the part in the full editor.
		return {
			postType: 'wp_template_part',
			postId: partId,
			isPreview: true,
		};
	},
	loader: async () => {
		await Promise.all( [
			resolveSitePartsUsage(),
			// The identity panel edits the site settings.
			resolveSelect( coreStore ).getEntityRecord( 'root', 'site' ),
		] );
	},
};
