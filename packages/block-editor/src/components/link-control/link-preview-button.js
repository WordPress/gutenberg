/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalTruncate as Truncate,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	FlexItem,
} from '@wordpress/components';
import { Icon, chevronDown } from '@wordpress/icons';
import { safeDecodeURI } from '@wordpress/url';

/**
 * Internal dependencies
 */
import useRichUrlData from './use-rich-url-data';

/**
 * Link preview button component that displays the current link information.
 * Clicking this button reveals the LinkControlSearchInput.
 *
 * @param {Object}   props         - Component props
 * @param {Object}   props.link    - Link object with label, url, type, kind, id
 * @param {boolean}  props.title   - Title to display
 * @param {boolean}  props.image   - Image to display
 * @param {string}   props.inputId - ID for the input element
 * @param {Function} props.onClick - Click handler
 * @param {Object}   props.props   - Additional props to pass to the button
 */
export function LinkPreviewButton( { link, title, image, onClick, ...props } ) {
	const { url } = link;

	// Fetch rich URL data if we don't have a title. Internal links should have passed a title.
	const { richData } = useRichUrlData( title ? null : url );

	// Get display title - use provided title, fallback to rich data, or URL
	const displayTitle = title || richData?.title || safeDecodeURI( url );

	// Get display URL - strip site URL if it matches current site
	let displayUrl = safeDecodeURI( url || '' );
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
		}
	} catch ( e ) {
		// If URL parsing fails, use the original URL
		displayUrl = safeDecodeURI( url || '' );
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
							<Truncate
								numberOfLines={ 1 }
								className="link-control-preview-button__url"
							>
								{ displayUrl }
							</Truncate>
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
