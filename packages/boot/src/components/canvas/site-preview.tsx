import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { focus } from '@wordpress/dom';
import { addQueryArgs } from '@wordpress/url';

/**
 * Renders the site's front end in an iframe.
 *
 * Shown where the canvas has no entity to edit, so that a route still says
 * something about the site it is configuring.
 *
 * @return The preview, or nothing until the site's address is known.
 */
export default function SitePreview() {
	const siteUrl = useSelect( ( select ) => {
		const siteData = select( coreStore ).getEntityRecord(
			'root',
			'__unstableBase'
		) as { home?: unknown } | undefined;
		return siteData?.home;
	}, [] );

	// `home` comes from the REST index. Without a usable URL the iframe would
	// resolve its `src` against the current admin page and embed that instead,
	// so render nothing until there is one.
	if ( typeof siteUrl !== 'string' || ! siteUrl ) {
		return null;
	}

	return (
		<iframe
			src={ addQueryArgs( siteUrl, {
				// Parameter for hiding the admin bar.
				wp_site_preview: 1,
			} ) }
			title={ __( 'Site Preview' ) }
			style={ {
				display: 'block',
				width: '100%',
				height: '100%',
				backgroundColor: '#fff',
			} }
			onLoad={ ( event ) => {
				const iframeDocument = ( event.target as HTMLIFrameElement )
					.contentDocument;

				// Not readable when the site is served from another origin.
				if ( ! iframeDocument ) {
					return;
				}

				// Make interactive elements unclickable.
				focus.focusable
					.find( iframeDocument.documentElement )
					.forEach( ( element ) => {
						element.style.pointerEvents = 'none';
						element.tabIndex = -1;
						element.setAttribute( 'aria-hidden', 'true' );
					} );
			} }
		/>
	);
}
