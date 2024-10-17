/**
 * Internal dependencies
 */
import { getPhotoHtml } from './util';

/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Placeholder, SandBox } from '@wordpress/components';
import { BlockIcon } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { getAuthority } from '@wordpress/url';

/**
 * Internal dependencies
 */
import WpEmbedPreview from './wp-embed-preview';

export default function EmbedPreview( {
	preview,
	previewable,
	url,
	type,
	isSelected,
	className,
	icon,
	label,
} ) {
	const [ interactive, setInteractive ] = useState( false );

	if ( ! isSelected && interactive ) {
		// We only want to change this when the block is not selected, because changing it when
		// the block becomes selected makes the overlap disappear too early. Hiding the overlay
		// happens on mouseup when the overlay is clicked.
		setInteractive( false );
	}

	const hideOverlay = () => {
		// This is called onMouseUp on the overlay. We can't respond to the `isSelected` prop
		// changing, because that happens on mouse down, and the overlay immediately disappears,
		// and the mouse event can end up in the preview content. We can't use onClick on
		// the overlay to hide it either, because then the editor misses the mouseup event, and
		// thinks we're multi-selecting blocks.
		setInteractive( true );
	};

	const { scripts } = preview;

	const html = 'photo' === type ? getPhotoHtml( preview ) : preview.html;
	const embedSourceUrl = getAuthority( url );
	const iframeTitle = sprintf(
		// translators: %s: host providing embed content e.g: www.youtube.com
		__( 'Embedded content from %s' ),
		embedSourceUrl
	);
	const sandboxClassnames = clsx(
		type,
		className,
		'wp-block-embed__wrapper'
	);

	// Disabled because the overlay div doesn't actually have a role or functionality
	// as far as the user is concerned. We're just catching the first click so that
	// the block can be selected without interacting with the embed preview that the overlay covers.
	/* eslint-disable jsx-a11y/no-static-element-interactions */
	const embedWrapper =
		'wp-embed' === type ? (
			<WpEmbedPreview html={ html } />
		) : (
			<div className="wp-block-embed__wrapper">
				<SandBox
					html={ html }
					scripts={ scripts }
					title={ iframeTitle }
					type={ sandboxClassnames }
					onFocus={ hideOverlay }
				/>
				{ ! interactive && (
					<div
						className="block-library-embed__interactive-overlay"
						onMouseUp={ hideOverlay }
					/>
				) }
			</div>
		);
	/* eslint-enable jsx-a11y/no-static-element-interactions */

	return (
		<>
			{ previewable ? (
				embedWrapper
			) : (
				<Placeholder
					icon={ <BlockIcon icon={ icon } showColors /> }
					label={ label }
				>
					<p className="components-placeholder__error">
						<a href={ url }>{ url }</a>
					</p>
					<p className="components-placeholder__error">
						{ sprintf(
							/* translators: %s: host providing embed content e.g: www.youtube.com */
							__(
								"Embedded content from %s can't be previewed in the editor."
							),
							embedSourceUrl
						) }
					</p>
				</Placeholder>
			) }
		</>
	);
}
