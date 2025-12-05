/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalTruncate as Truncate,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	FlexItem,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { Icon, chevronDown } from '@wordpress/icons';
import { safeDecodeURI } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useRichUrlData from './use-rich-url-data';
import { unlock } from '../../lock-unlock';

const { Badge } = unlock( componentsPrivateApis );

/**
 * Capitalize the first letter of a string.
 *
 * @param {string} str - The string to capitalize
 * @return {string} Capitalized string
 */
function capitalize( str ) {
	return str.charAt( 0 ).toUpperCase() + str.slice( 1 );
}

/**
 * Link preview button component that displays the current link information.
 * Clicking this button reveals the LinkControlSearchInput.
 *
 * @param {Object}   props                   - Component props
 * @param {Object}   props.link              - Link object with label, url, type, kind, id
 * @param {boolean}  props.title             - Title to display
 * @param {boolean}  props.image             - Image to display
 * @param {string}   props.entityStatus      - Entity status (publish, draft, etc.)
 * @param {boolean}  props.hasBinding        - Whether link has entity binding
 * @param {boolean}  props.isEntityAvailable - Whether bound entity is available
 * @param {Function} props.onClick           - Click handler
 * @param {Object}   props.props             - Additional props to pass to the button
 */
export function LinkPreviewButton( {
	link,
	title,
	image,
	entityStatus,
	hasBinding,
	isEntityAvailable,
	onClick,
	...props
} ) {
	const { url, type } = link;

	// Fetch rich URL data if we don't have a title. Internal links should have passed a title.
	const { richData } = useRichUrlData( title ? null : url );

	// Get display title - use provided title, fallback to rich data, or URL
	const displayTitle = url
		? title || richData?.title || safeDecodeURI( url )
		: 'Add link';

	// Get display URL - strip site URL if it matches current site
	let displayUrl = safeDecodeURI( url || '' );
	let isExternal = false;
	try {
		const linkUrl = new URL( url );
		const siteUrl = window.location.origin;
		if ( linkUrl.origin === siteUrl ) {
			// Show only the pathname (and search/hash if present)
			let path = linkUrl.pathname + linkUrl.search + linkUrl.hash;
			// Remove trailing slash
			if ( path.endsWith( '/' ) && path.length > 1 ) {
				path = path.slice( 0, -1 );
			}
			displayUrl = path;
		} else {
			isExternal = true;
		}
	} catch ( e ) {
		// If URL parsing fails, use the original URL
		displayUrl = safeDecodeURI( url || '' );
	}

	// Determine kind badge
	let kindBadge = null;
	if ( url ) {
		if ( isExternal ) {
			kindBadge = { label: __( 'External link' ), intent: 'default' };
		} else if ( type ) {
			kindBadge = { label: capitalize( type ), intent: 'default' };
		}
	}

	// Determine status badge
	let statusBadge = null;
	if ( ! url ) {
		statusBadge = { label: __( 'No link selected' ), intent: 'error' };
	} else if ( hasBinding && ! isEntityAvailable ) {
		statusBadge = { label: __( 'Deleted' ), intent: 'error' };
	} else if ( entityStatus ) {
		const statusMap = {
			publish: { label: __( 'Published' ), intent: 'success' },
			future: { label: __( 'Scheduled' ), intent: 'warning' },
			draft: { label: __( 'Draft' ), intent: 'warning' },
			pending: { label: __( 'Pending' ), intent: 'warning' },
			private: { label: __( 'Private' ), intent: 'default' },
			trash: { label: __( 'Trash' ), intent: 'error' },
		};
		statusBadge = statusMap[ entityStatus ] || null;
	}

	return (
		<Button
			className="link-control-preview-button"
			onClick={ onClick }
			variant="secondary"
			__next40pxDefaultSize
			{ ...props }
		>
			<HStack justify="space-between" alignment="top">
				<FlexItem className="link-control-preview-button__content">
					<HStack alignment="top">
						{ image && (
							<FlexItem className="link-control-preview-button__image-container">
								<img
									className="link-control-preview-button__image"
									src={ image }
									alt=""
								/>
							</FlexItem>
						) }

						<VStack
							className="link-control-preview-button__details"
							alignment="topLeft"
						>
							<Truncate
								numberOfLines={ 1 }
								className="link-control-preview-button__title"
							>
								{ displayTitle }
							</Truncate>
							{ displayUrl && (
								<Truncate
									numberOfLines={ 1 }
									className="link-control-preview-button__hint"
								>
									{ displayUrl }
								</Truncate>
							) }
							{ ( kindBadge || statusBadge ) && (
								<HStack
									className="link-control-preview-button__badges"
									alignment="left"
								>
									{ kindBadge && (
										<Badge intent={ kindBadge.intent }>
											{ kindBadge.label }
										</Badge>
									) }
									{ statusBadge && (
										<Badge intent={ statusBadge.intent }>
											{ statusBadge.label }
										</Badge>
									) }
								</HStack>
							) }
						</VStack>
					</HStack>
				</FlexItem>
				<Icon
					icon={ chevronDown }
					className="link-control-preview-button__icon"
				/>
			</HStack>
		</Button>
	);
}
