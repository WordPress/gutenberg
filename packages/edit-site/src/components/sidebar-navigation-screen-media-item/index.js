/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalUseNavigator as useNavigator,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';
import { download } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import {
	SidebarNavigationScreenDetailsPanel,
	SidebarNavigationScreenDetailsPanelRow,
	SidebarNavigationScreenDetailsPanelLabel,
	SidebarNavigationScreenDetailsPanelValue,
} from '../sidebar-navigation-screen-details-panel';

function getMediaDetails( record ) {
	if ( ! record ) {
		return [];
	}

	const details = [];

	if ( record?.mime_type ) {
		details.push( {
			label: __( 'File type' ),
			value: record.mime_type,
		} );
	}

	if ( record?.date ) {
		const formattedDate = dateI18n(
			getSettings().formats.datetimeAbbreviated,
			getDate( record?.date )
		);
		details.push( {
			label: __( 'Uploaded' ),
			value: createInterpolateElement(
				sprintf(
					/* translators: %s: is the relative time when the post was last modified. */
					__( '<time>%s</time>' ),
					formattedDate
				),
				{
					time: <time dateTime={ record.date } />,
				}
			),
		} );
	}

	if ( record?.media_details ) {
		const { width, height, filesize } = record.media_details;

		if ( width && height ) {
			details.push( {
				label: __( 'Dimensions (px)' ),
				value: `${ width } × ${ height }`,
			} );
		}

		if ( filesize ) {
			details.push( {
				label: __( 'File size' ),
				value: `${ filesize / 1000 } kb`,
			} );
		}
	}

	return details;
}

export default function SidebarNavigationScreenMediaItem() {
	const { params } = useNavigator();
	const { postId, mediaType } = params;
	const { record } = useSelect(
		( select ) => {
			const { getMedia } = select( coreStore );
			return {
				record: getMedia( postId ),
			};
		},
		[ postId ]
	);

	// The absence of a media type in the query params for media
	// indicates the user has arrived at the template part via the "media" main
	// view and the back button should return them to that list page.
	const backPath = mediaType ? `/media/${ mediaType }` : '/media';

	return (
		<SidebarNavigationScreen
			title={ decodeEntities(
				record?.title?.rendered || __( '(no title)' )
			) }
			backPath={ backPath }
			content={
				<SidebarNavigationScreenDetailsPanel
					spacing={ 5 }
					title={ __( 'Details' ) }
				>
					{ getMediaDetails( record ).map( ( { label, value } ) => (
						<SidebarNavigationScreenDetailsPanelRow key={ label }>
							<SidebarNavigationScreenDetailsPanelLabel>
								{ label }
							</SidebarNavigationScreenDetailsPanelLabel>
							<SidebarNavigationScreenDetailsPanelValue>
								{ value }
							</SidebarNavigationScreenDetailsPanelValue>
						</SidebarNavigationScreenDetailsPanelRow>
					) ) }
				</SidebarNavigationScreenDetailsPanel>
			}
			footer={
				<Button
					className="edit-site-sidebar__media-item-download-button"
					href={ record?.source_url }
					download
					icon={ download }
				>
					{ __( 'Download file' ) }
				</Button>
			}
		/>
	);
}
