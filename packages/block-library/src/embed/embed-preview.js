/**
 * Internal dependencies
 */
import { getPhotoHtml } from './util';

/**
 * External dependencies
 */
import classnames from 'classnames/dedupe';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Placeholder, SandBox } from '@wordpress/components';
import {
	RichText,
	BlockIcon,
	__experimentalGetElementClassName,
} from '@wordpress/block-editor';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import WpEmbedPreview from './wp-embed-preview';

export default function EmbedPreview( {
	preview,
	previewable,
	url,
	type,
	caption,
	onCaptionChange,
	isSelected,
	className,
	icon,
	label,
	insertBlocksAfter,
} ) {
	const [ interactive, setInteractive ] = useState( false );

	useEffect( () => {
		if ( isSelected && interactive ) {
			setInteractive( false );
		}
	}, [ isSelected ] );

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
	const parsedHost = new URL( url ).host.split( '.' );
	const parsedHostBaseUrl = parsedHost
		.splice( parsedHost.length - 2, parsedHost.length - 1 )
		.join( '.' );
	const iframeTitle = sprintf(
		// translators: %s: host providing embed content e.g: www.youtube.com
		__( 'Embedded content from %s' ),
		parsedHostBaseUrl
	);
	const sandboxClassnames = classnames(
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
		<figure
			className={ classnames( className, 'wp-block-embed', {
				'is-type-video': 'video' === type,
			} ) }
		>
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
							parsedHostBaseUrl
						) }
					</p>
				</Placeholder>
			) }
			{ ( ! RichText.isEmpty( caption ) || isSelected ) && (
				<RichText
					identifier="caption"
					tagName="figcaption"
					className={ __experimentalGetElementClassName( 'caption' ) }
					placeholder={ __( 'Add caption' ) }
					value={ caption }
					onChange={ onCaptionChange }
					inlineToolbar
					__unstableOnSplitAtEnd={ () =>
						insertBlocksAfter(
							createBlock( getDefaultBlockName() )
						)
					}
				/>
			) }
		</figure>
	);
}
