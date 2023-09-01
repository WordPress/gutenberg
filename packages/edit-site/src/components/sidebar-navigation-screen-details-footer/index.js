/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { humanTimeDiff } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { Button, Icon } from '@wordpress/components';
import { backup } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	SidebarNavigationScreenDetailsPanelRow,
	SidebarNavigationScreenDetailsPanelLabel,
	SidebarNavigationScreenDetailsPanelValue,
} from '../sidebar-navigation-screen-details-panel';

function ScreenDetailsLastModifiedDate( { lastModifiedDateTime } ) {
	return (
		<SidebarNavigationScreenDetailsPanelRow
			className="edit-site-sidebar-navigation-screen-details-footer__revision"
			justify="space-between"
		>
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
						time: <time dateTime={ lastModifiedDateTime } />,
					}
				) }
			</SidebarNavigationScreenDetailsPanelValue>
			<Icon
				className="edit-site-sidebar-navigation-screen-details-footer__icon"
				icon={ backup }
			/>
		</SidebarNavigationScreenDetailsPanelRow>
	);
}
export default function SidebarNavigationScreenDetailsFooter( {
	record,
	onClickRevisions,
} ) {
	/*
	 * There might be other items in the future,
	 * but for now it's just modified date,
	 * so return null if there's no record?.modified.
	 */
	if ( ! record?.modified ) {
		return null;
	}

	const lastRevisionId = record?._links?.[ 'predecessor-version' ]?.[ 0 ]?.id;

	let revisionsButtonNavigationProps = null;

	if ( onClickRevisions ) {
		revisionsButtonNavigationProps = {
			onClick: onClickRevisions,
		};
	}

	if ( lastRevisionId ) {
		revisionsButtonNavigationProps = {
			href: addQueryArgs( 'revision.php', {
				revision: lastRevisionId,
				gutenberg: true,
			} ),
		};
	}

	return (
		<div className="edit-site-sidebar-navigation-screen-details-footer">
			{ revisionsButtonNavigationProps ? (
				<Button
					className="edit-site-sidebar-navigation-screen-details-footer__button"
					label={ __( 'Revisions' ) }
					{ ...revisionsButtonNavigationProps }
				>
					<ScreenDetailsLastModifiedDate
						lastModifiedDateTime={ record.modified }
					/>
				</Button>
			) : (
				<ScreenDetailsLastModifiedDate
					lastModifiedDateTime={ record.modified }
				/>
			) }
		</div>
	);
}
