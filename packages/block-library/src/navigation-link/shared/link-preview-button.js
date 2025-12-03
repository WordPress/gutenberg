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
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Link preview button component that displays the current link information.
 * Clicking this button reveals the LinkControlSearchInput.
 *
 * @param {Object}   props               - Component props
 * @param {Object}   props.link          - Link object with label, url, type, kind
 * @param {string}   props.featuredImage - Featured image URL (optional)
 * @param {Function} props.onClick       - Click handler
 * @param {Object}   props.buttonRef     - Ref to attach to button
 * @param {Object}   props.props         - Additional props to pass to the button
 */
export function LinkPreviewButton( {
	link,
	featuredImage,
	onClick,
	buttonRef,
	...props
} ) {
	const { label, url } = link;

	// Get display title
	const title = label ? stripHTML( label ) : safeDecodeURI( url );

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
			ref={ buttonRef }
			className="link-control-preview-button"
			onClick={ onClick }
			variant="secondary"
			__next40pxDefaultSize
			{ ...props }
		>
			<HStack justify="space-between" alignment="top">
				<FlexItem className="link-control-preview-button__content">
					<HStack alignment="top">
						{ featuredImage && (
							<FlexItem className="link-control-preview-button__image-container">
								<img
									className="link-control-preview-button__image"
									src={ featuredImage }
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
								{ title }
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
