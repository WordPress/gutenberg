/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { createSlotFill, ExternalLink, Button } from '@wordpress/components';
import { safeDecodeURI, filterURLForDisplay } from '@wordpress/url';
import { useMemo } from '@wordpress/element';

const { Slot, Fill } = createSlotFill( 'BlockEditorURLPopoverLinkViewer' );

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

function LinkViewer( {
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
			<Slot fillProps={ useMemo( () => ( { url } ), [ url ] ) } />
		</div>
	);
}

LinkViewer.Fill = Fill;

export default LinkViewer;
