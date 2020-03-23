/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink, Button } from '@wordpress/components';
import { safeDecodeURI, filterURLForDisplay } from '@wordpress/url';
import { pencil } from '@wordpress/icons';

function LinkViewerUrl( { url, urlLabel, className } ) {
	const linkClassName = classnames(
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

export default function LinkViewer( {
	className,
	linkClassName,
	onEditLinkClick,
	url,
	urlLabel,
	...props
} ) {
	return (
		<div
			className={ classnames(
				'block-editor-url-popover__link-viewer',
				className
			) }
			{ ...props }
		>
			<LinkViewerUrl
				url={ url }
				urlLabel={ urlLabel }
				className={ linkClassName }
			/>
			{ onEditLinkClick && (
				<Button
					icon={ pencil }
					label={ __( 'Edit' ) }
					onClick={ onEditLinkClick }
				/>
			) }
		</div>
	);
}
