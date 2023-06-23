/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { humanTimeDiff } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	SidebarNavigationScreenDetailsPanelRow,
	SidebarNavigationScreenDetailsPanelLabel,
	SidebarNavigationScreenDetailsPanelValue,
} from '../sidebar-navigation-screen-details-panel';

export default function SidebarNavigationScreenDetailsFooter( {
	lastModifiedDateTime,
} ) {
	return (
		<>
			{ lastModifiedDateTime && (
				<SidebarNavigationScreenDetailsPanelRow className="edit-site-sidebar-navigation-screen-details-footer">
					<SidebarNavigationScreenDetailsPanelLabel>
						{ __( 'Last modified' ) }
					</SidebarNavigationScreenDetailsPanelLabel>
					<SidebarNavigationScreenDetailsPanelValue>
						{ createInterpolateElement(
							sprintf(
								/* translators: %s: is the relative time when the post was last modified. */
								__( '<time>%s</time>' ),
								humanTimeDiff( lastModifiedDateTime )
							),
							{
								time: (
									<time dateTime={ lastModifiedDateTime } />
								),
							}
						) }
					</SidebarNavigationScreenDetailsPanelValue>
				</SidebarNavigationScreenDetailsPanelRow>
			) }
		</>
	);
}
