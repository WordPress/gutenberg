import type { ComponentType } from 'react';
import { useSitePart } from './use-site-part';
import SitePartIdentity from './site-part-identity';
import SitePartMenu from './site-part-menu';
import SitePartSocialLinks from './site-part-social-links';

export {
	getSitePartAreas,
	getSitePartArea,
	SITE_PART_PANELS,
} from './constants';
export {
	getSitePartPanels,
	getSitePartPanelTitle,
} from './get-site-part-panels';
export { useSitePart, useSitePartsUsage, getPartsInUse } from './use-site-part';
export { resolveSitePartsUsage } from './resolve-site-parts-usage';
export { useUsedOnLabel } from './use-used-on-label';
export { default as SitePartSyncedNotice } from './site-part-synced-notice';

/**
 * The body of one Site parts panel for the primary part in an area. Each site
 * editor wraps it in its own screen.
 *
 * The menu panel needs the editor assets to have loaded: callers that load
 * them lazily must wait for them before rendering it.
 *
 * @param props           Component props.
 * @param props.area      The template part area.
 * @param props.panel     The panel to show.
 * @param props.MediaEdit The edit component for the site logo.
 */
export function SitePartPanelContent( {
	area,
	panel,
	MediaEdit,
}: {
	area: string;
	panel: string;
	MediaEdit: ComponentType< any >;
} ) {
	const { blocks, contents, setBlocks, commitBlocks, partId } =
		useSitePart( area );
	if ( ! partId ) {
		return null;
	}
	switch ( panel ) {
		case 'identity':
			return (
				<SitePartIdentity
					contents={ contents }
					MediaEdit={ MediaEdit }
				/>
			);
		case 'menu':
			return (
				<SitePartMenu
					area={ area }
					blocks={ blocks }
					contents={ contents }
					setBlocks={ setBlocks }
				/>
			);
		case 'social-links':
			return (
				<SitePartSocialLinks
					blocks={ blocks }
					contents={ contents }
					setBlocks={ setBlocks }
					commitBlocks={ commitBlocks }
				/>
			);
	}
	return null;
}
