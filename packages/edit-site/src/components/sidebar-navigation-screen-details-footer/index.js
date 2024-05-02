/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { humanTimeDiff } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import {
	Icon,
	__experimentalItemGroup as ItemGroup,
} from '@wordpress/components';
import { backup } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	SidebarNavigationScreenDetailsPanelRow,
	SidebarNavigationScreenDetailsPanelLabel,
	SidebarNavigationScreenDetailsPanelValue,
} from '../sidebar-navigation-screen-details-panel';
import SidebarNavigationItem from '../sidebar-navigation-item';

export default function SidebarNavigationScreenDetailsFooter( {
	record,
	...otherProps
} ) {
	/*
	 * There might be other items in the future,
	 * but for now it's just modified date.
	 * Later we might render a list of items and isolate
	 * the following logic.
	 */
	const hrefProps = {};
	const lastRevisionId =
		record?._links?.[ 'predecessor-version' ]?.[ 0 ]?.id ?? null;
	const revisionsCount =
		record?._links?.[ 'version-history' ]?.[ 0 ]?.count ?? 0;
	// Enable the revisions link if there is a last revision and there are more than one revisions.
	if ( lastRevisionId && revisionsCount > 1 ) {
		hrefProps.href = addQueryArgs( 'revision.php', {
			revision: record?._links[ 'predecessor-version' ][ 0 ].id,
		} );
		hrefProps.as = 'a';
	}
	return (
		<ItemGroup className="edit-site-sidebar-navigation-screen-details-footer">
			<SidebarNavigationItem
				aria-label={ __( 'Revisions' ) }
				{ ...hrefProps }
				{ ...otherProps }
			>
				<SidebarNavigationScreenDetailsPanelRow justify="space-between">
					<SidebarNavigationScreenDetailsPanelLabel>
						{ __( 'Last modified' ) }
					</SidebarNavigationScreenDetailsPanelLabel>
					<SidebarNavigationScreenDetailsPanelValue>
						{ createInterpolateElement(
							sprintf(
								/* translators: %s: is the relative time when the post was last modified. */
								__( '<time>%s</time>' ),
								humanTimeDiff( record.modified )
							),
							{
								time: <time dateTime={ record.modified } />,
							}
						) }
					</SidebarNavigationScreenDetailsPanelValue>
					<Icon
						className="edit-site-sidebar-navigation-screen-details-footer__icon"
						icon={ backup }
					/>
				</SidebarNavigationScreenDetailsPanelRow>
			</SidebarNavigationItem>
		</ItemGroup>
	);
}
