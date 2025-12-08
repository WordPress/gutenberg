/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, sprintf, isRTL } from '@wordpress/i18n';
import { Placeholder, SandBox, ResizableBox } from '@wordpress/components';
import { BlockIcon, store as blockEditorStore } from '@wordpress/block-editor';
import { useState, useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { getAuthority } from '@wordpress/url';
import { useResizeObserver, useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { getPhotoHtml } from './util';
import WpEmbedPreview from './wp-embed-preview';

export default function ResizableEmbedPreview( {
	preview,
	previewable,
	url,
	type,
	isSelected,
	className,
	icon,
	label,
	attributes,
	setAttributes,
} ) {
	const [ interactive, setInteractive ] = useState( false );
	const [ resizeDelta, setResizeDelta ] = useState( null );
	const [ pixelSize, setPixelSize ] = useState( {} );
	const [ offsetTop, setOffsetTop ] = useState( 0 );
	const [ embedElement, setEmbedElement ] = useState();

	const { toggleSelection } = useDispatch( blockEditorStore );

	// Extract aspect ratio from preview dimensions if available
	const aspectRatio =
		preview.width && preview.height
			? preview.width / preview.height
			: 16 / 9; // Default to 16:9 aspect ratio

	// Use resize observer like image block - attach to embed container
	const setResizeObserved = useResizeObserver( ( [ entry ] ) => {
		if ( ! resizeDelta ) {
			const [ box ] = entry.borderBoxSize;
			setPixelSize( {
				width: box.inlineSize,
				height: box.blockSize,
			} );
		}
		// This is usually 0 unless the embed height is less than the line-height.
		setOffsetTop( entry.target.offsetTop );
	} );

	const effectResizeableBoxPlacement = useCallback( () => {
		setOffsetTop( embedElement?.offsetTop ?? 0 );
	}, [ embedElement ] );

	const setRefs = useMergeRefs( [ setEmbedElement, setResizeObserved ] );

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
			<div
				className="wp-block-embed__wrapper"
				ref={ setRefs }
				style={ {
					...( resizeDelta
						? {
								width: `${
									pixelSize.width + resizeDelta.width
								}px`,
								height: `${
									pixelSize.height + resizeDelta.height
								}px`,
						  }
						: {
								width: attributes.width || undefined,
								height: attributes.height || undefined,
						  } ),
				} }
			>
				<SandBox
					html={ html }
					scripts={ scripts }
					title={ iframeTitle }
					type={ sandboxClassnames }
					onFocus={ hideOverlay }
				/>
				{ ! interactive && ! isSelected && (
					<div
						className="block-library-embed__interactive-overlay"
						onMouseUp={ hideOverlay }
						style={ {
							pointerEvents: isSelected ? 'none' : 'auto',
						} }
					/>
				) }
			</div>
		);
	/* eslint-enable jsx-a11y/no-static-element-interactions */

	const embedPreview = (
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

	// Show resizable box only when selected and previewable - similar to image block
	let resizableBox;
	if ( isSelected && previewable ) {
		// Calculate current dimensions - following image block pattern
		const customRatio = pixelSize.width / pixelSize.height;
		const naturalRatio =
			preview.width && preview.height
				? preview.width / preview.height
				: aspectRatio;
		const ratio = customRatio || naturalRatio || aspectRatio;

		// Min and max dimensions
		const minWidth = 50;
		const minHeight = 50 / ratio;
		const maxResizeWidth = 1200; // Reasonable max width

		// Determine which resize handles to show based on alignment - exactly like image block
		const { align } = attributes;
		let showRightHandle = false;
		let showLeftHandle = false;

		/* eslint-disable no-lonely-if */
		// See https://github.com/WordPress/gutenberg/issues/7584.
		if ( align === 'center' ) {
			// When the embed is centered, show both handles.
			showRightHandle = true;
			showLeftHandle = true;
		} else if ( isRTL() ) {
			// In RTL mode the embed is on the right by default.
			// Show the right handle and hide the left handle only when it is
			// aligned left. Otherwise always show the left handle.
			if ( align === 'left' ) {
				showRightHandle = true;
			} else {
				showLeftHandle = true;
			}
		} else {
			// Show the left handle and hide the right handle only when the
			// embed is aligned right. Otherwise always show the right handle.
			if ( align === 'right' ) {
				showLeftHandle = true;
			} else {
				showRightHandle = true;
			}
		}
		/* eslint-enable no-lonely-if */

		resizableBox = (
			<ResizableBox
				ref={ effectResizeableBoxPlacement }
				style={ {
					position: 'absolute',
					// To match the vertical-align: bottom of the embed (similar to image)
					// syncs the top with the embed. This matters when the embed height is
					// less than the line-height.
					inset: `${ offsetTop }px 0 0 0`,
				} }
				size={ pixelSize }
				minWidth={ minWidth }
				maxWidth={ maxResizeWidth }
				minHeight={ minHeight }
				maxHeight={ maxResizeWidth / ratio }
				lockAspectRatio={ ratio }
				enable={ {
					top: false,
					right: showRightHandle,
					bottom: true,
					left: showLeftHandle,
				} }
				onResizeStart={ () => {
					toggleSelection( false );
				} }
				onResize={ ( event, direction, elt, delta ) => {
					setResizeDelta( delta );
				} }
				onResizeStop={ ( event, direction, elt, delta ) => {
					toggleSelection( true );
					setResizeDelta( null );
					setPixelSize( ( current ) => ( {
						width: current.width + delta.width,
						height: current.height + delta.height,
					} ) );

					// Set the final width and height - similar to image block
					setAttributes( {
						width: `${ elt.offsetWidth }px`,
						height: 'auto', // Let CSS maintain aspect ratio
					} );
				} }
				resizeRatio={ align === 'center' ? 2 : 1 }
			/>
		);
	}

	return (
		<div style={ { position: 'relative' } }>
			{ embedPreview }
			{ resizableBox }
		</div>
	);
}
