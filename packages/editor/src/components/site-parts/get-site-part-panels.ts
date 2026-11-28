import { __, _n, _x } from '@wordpress/i18n';
import { navigation, share, siteLogo } from '@wordpress/icons';
import type { ReactElement } from 'react';
import type { SitePartPanel } from './constants';
import type { SitePartContents } from './get-site-part-contents';
import { hasIdentityPanel } from './site-part-identity';

export interface SitePartPanelItem {
	panel: SitePartPanel;
	label: string;
	/** The icon used for the same thing elsewhere in the site editor. */
	icon: ReactElement;
}

/**
 * The panels to offer for a part, each only when the part holds the blocks
 * the panel edits, in the order the area screen lists them.
 *
 * @param contents What the part holds.
 * @return The panels.
 */
export function getSitePartPanels(
	contents: SitePartContents
): SitePartPanelItem[] {
	const panels: SitePartPanelItem[] = [];
	if ( hasIdentityPanel( contents ) ) {
		// Named after the Identity screen, whose fields the panel shows.
		panels.push( {
			panel: 'identity',
			label: _x( 'Identity', 'site identity' ),
			icon: siteLogo,
		} );
	}
	const menuCount = contents.navigations.length;
	if ( menuCount ) {
		panels.push( {
			panel: 'menu',
			label: _n( 'Menu', 'Menus', menuCount ),
			icon: navigation,
		} );
	}
	if ( contents.socialLinks ) {
		panels.push( {
			panel: 'social-links',
			label: __( 'Social icons' ),
			icon: share,
		} );
	}
	return panels;
}

/**
 * The title of a panel, for its screen heading.
 *
 * @param panel    The panel.
 * @param contents What the part holds.
 * @return The title, or `undefined` for an unknown panel.
 */
export function getSitePartPanelTitle(
	panel: string,
	contents: SitePartContents
): string | undefined {
	return getSitePartPanels( contents ).find(
		( item ) => item.panel === panel
	)?.label;
}
