import type { ReactElement, SVGProps } from 'react';
import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { unlock } from '../../lock-unlock';

const { getTemplatePartIcon } = unlock( coreDataPrivateApis ) as {
	getTemplatePartIcon: (
		area: string
	) => ReactElement< SVGProps< SVGSVGElement > >;
};

export interface SitePartArea {
	/** The template part area. */
	area: string;
	/** Name of the area, as a screen title. */
	label: string;
	/** The area's template part icon. */
	icon: ReactElement< SVGProps< SVGSVGElement > >;
	/** Link to the parts in this area that templates use. */
	inUseLabel: string;
	/** Link to every part in this area. */
	allLabel: string;
	/** Shown when the homepage uses no part in this area. */
	missingLabel: string;
	/** Explains the Menu panel's menu picker. */
	menuDescription: string;
	/** Warns that changes to the part show across the site. */
	syncedNotice: string;
	/**
	 * Warns, in the Menu panel, that the part and the menus it shows both
	 * reach beyond this screen.
	 */
	menuSyncedNotice: string;
	/**
	 * Warns, in the Identity panel, that the site's details show wherever the
	 * site uses them, not only in this part.
	 */
	identitySyncedNotice: string;
}

/**
 * The areas the Site parts screen offers, in the order it lists them.
 */
export function getSitePartAreas(): SitePartArea[] {
	return [
		{
			area: 'header',
			icon: getTemplatePartIcon( 'header' ),
			label: __( 'Header' ),
			inUseLabel: __( 'Other headers in use' ),
			allLabel: __( 'All headers' ),
			missingLabel: __( 'Your homepage doesn’t have a header.' ),
			menuDescription: __( 'Choose the menu your header shows.' ),
			syncedNotice: __(
				'Your header appears across your whole site. Changes here affect every page that shows it.'
			),
			menuSyncedNotice: __(
				'Your header appears across your whole site, and a menu can be used in more than one place. Changes here affect every page that shows them.'
			),
			identitySyncedNotice: __(
				'These details are shared across your whole site. Changes here update them everywhere they appear, not just in your header.'
			),
		},
		{
			area: 'footer',
			icon: getTemplatePartIcon( 'footer' ),
			label: __( 'Footer' ),
			inUseLabel: __( 'Other footers in use' ),
			allLabel: __( 'All footers' ),
			missingLabel: __( 'Your homepage doesn’t have a footer.' ),
			menuDescription: __( 'Choose the menu your footer shows.' ),
			syncedNotice: __(
				'Your footer appears across your whole site. Changes here affect every page that shows it.'
			),
			menuSyncedNotice: __(
				'Your footer appears across your whole site, and a menu can be used in more than one place. Changes here affect every page that shows them.'
			),
			identitySyncedNotice: __(
				'These details are shared across your whole site. Changes here update them everywhere they appear, not just in your footer.'
			),
		},
		{
			area: 'navigation-overlay',
			icon: getTemplatePartIcon( 'navigation-overlay' ),
			label: __( 'Navigation overlay' ),
			inUseLabel: __( 'Other overlays in use' ),
			allLabel: __( 'All overlays' ),
			missingLabel: __(
				'Your header’s menu doesn’t open a navigation overlay.'
			),
			menuDescription: __( 'Choose the menu your overlay shows.' ),
			syncedNotice: __(
				'Your navigation overlay appears across your whole site. Changes here affect every page that shows it.'
			),
			menuSyncedNotice: __(
				'Your navigation overlay appears across your whole site, and a menu can be used in more than one place. Changes here affect every page that shows them.'
			),
			identitySyncedNotice: __(
				'These details are shared across your whole site. Changes here update them everywhere they appear, not just in your navigation overlay.'
			),
		},
	];
}

/**
 * The area details for one area.
 *
 * @param area The template part area.
 * @return The area details, or `undefined` for an area Site parts doesn't offer.
 */
export function getSitePartArea( area: string ): SitePartArea | undefined {
	return getSitePartAreas().find( ( item ) => item.area === area );
}

/**
 * The panels an area screen can open. Each one is offered only when the part
 * holds the blocks it edits.
 */
export const SITE_PART_PANELS = [ 'identity', 'menu', 'social-links' ] as const;

export type SitePartPanel = ( typeof SITE_PART_PANELS )[ number ];
