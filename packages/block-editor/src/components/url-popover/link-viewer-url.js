/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { ExternalLink } from '@wordpress/components';
import { safeDecodeURI, filterURLForDisplay } from '@wordpress/url';

export default function LinkViewerURL( { url, urlLabel, className } ) {
	const linkClassName = clsx(
		className,
		'block-editor-url-popover__link-viewer-url'
	);

	if ( ! url ) {
		return <span className={ linkClassName }></span>;
	}

	return (
		<ExternalLink className={ linkClassName } href={ url }>
			{ urlLabel || filterURLForDisplay( safeDecodeURI( url ) ) }
		</ExternalLink>
	);
}
