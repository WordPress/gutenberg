/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import {
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PanelBody, Button, Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import {
	store as uploadStore,
	isClientSideMediaSupported,
} from '@wordpress/upload-media';
import { __ } from '@wordpress/i18n';

/**
 * Whether the client-side optimization control should be available.
 *
 * @return {boolean} True when client-side media processing is enabled and supported.
 */
function isOptimizationAvailable() {
	return (
		typeof window !== 'undefined' &&
		Boolean( window.__clientSideMediaProcessing ) &&
		isClientSideMediaSupported()
	);
}

/**
 * Shared control that optimizes a given attachment and repoints the block.
 *
 * Resolves the attachment's full-size original URL, dispatches the
 * client-side optimization, and reports progress and errors via snackbars.
 *
 * @param {Object}   props              Component props.
 * @param {number}   props.attachmentId Attachment ID to optimize.
 * @param {Function} props.onComplete   Called with the new attachment to repoint the block.
 * @return {Component|null} The control, or null when there is nothing to optimize.
 */
function OptimizeControl( { attachmentId, onComplete } ) {
	const { optimizeExistingItem } = useDispatch( uploadStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const { media, isOptimizing } = useSelect(
		( select ) => ( {
			media: attachmentId
				? select( coreStore ).getMedia( attachmentId, {
						context: 'view',
				  } )
				: undefined,
			isOptimizing: attachmentId
				? select( uploadStore ).isUploadingById( attachmentId )
				: false,
		} ),
		[ attachmentId ]
	);

	// Only images sourced from a real attachment can be optimized.
	const sourceUrl = media?.source_url;
	const isImage = media?.media_type === 'image';
	if ( ! attachmentId || ! sourceUrl || ! isImage ) {
		return null;
	}

	const optimize = () => {
		optimizeExistingItem( {
			id: attachmentId,
			url: sourceUrl,
			onSuccess: ( [ newMedia ] ) => {
				if ( newMedia ) {
					onComplete( newMedia );
				}
				createSuccessNotice( __( 'Image optimized.' ), {
					type: 'snackbar',
				} );
			},
			onError: ( error ) => {
				createErrorNotice(
					error?.message || __( 'Failed to optimize image.' ),
					{ type: 'snackbar' }
				);
			},
		} );
	};

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Optimize' ) } initialOpen={ false }>
				<p>
					{ __(
						'Re-process this image in your browser to reduce its file size.'
					) }
				</p>
				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ optimize }
					disabled={ isOptimizing }
					accessibleWhenDisabled
					icon={ isOptimizing ? <Spinner /> : undefined }
				>
					{ isOptimizing
						? __( 'Optimizing…' )
						: __( 'Optimize image' ) }
				</Button>
			</PanelBody>
		</InspectorControls>
	);
}

/**
 * Control for blocks that store the attachment in `id`/`url` attributes
 * (`core/image`, `core/cover`).
 *
 * @param {Object} props            Block edit props.
 * @param {Object} props.attributes Block attributes.
 * @param {string} props.clientId   Block client ID.
 * @return {Component|null} The control.
 */
function AttributeImageControl( { attributes, clientId } ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	return (
		<OptimizeControl
			attachmentId={ attributes.id }
			onComplete={ ( media ) =>
				updateBlockAttributes( clientId, {
					id: media.id,
					url: media.url,
				} )
			}
		/>
	);
}

/**
 * Control for the `core/media-text` block.
 *
 * @param {Object} props            Block edit props.
 * @param {Object} props.attributes Block attributes.
 * @param {string} props.clientId   Block client ID.
 * @return {Component|null} The control.
 */
function MediaTextControl( { attributes, clientId } ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	if ( attributes.mediaType !== 'image' ) {
		return null;
	}
	return (
		<OptimizeControl
			attachmentId={ attributes.mediaId }
			onComplete={ ( media ) =>
				updateBlockAttributes( clientId, {
					mediaId: media.id,
					mediaUrl: media.url,
				} )
			}
		/>
	);
}

/**
 * Control for the `core/post-featured-image` block.
 *
 * Uses the block's `postId`/`postType` context so each instance (including
 * those inside a query loop) optimizes the correct post's featured image.
 *
 * @param {Object} props         Block edit props.
 * @param {Object} props.context Block context (postId, postType).
 * @return {Component|null} The control.
 */
function FeaturedImageControl( { context } ) {
	const { postId, postType } = context || {};
	const [ featuredMedia, setFeaturedMedia ] = useEntityProp(
		'postType',
		postType,
		'featured_media',
		postId
	);
	if ( ! postId || ! postType ) {
		return null;
	}
	return (
		<OptimizeControl
			attachmentId={ featuredMedia }
			onComplete={ ( media ) => setFeaturedMedia( media.id ) }
		/>
	);
}

/**
 * Control for the `core/site-logo` block.
 *
 * @return {Component|null} The control.
 */
function SiteLogoControl() {
	const { editEntityRecord } = useDispatch( coreStore );
	const siteLogoId = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecord( 'root', 'site' )?.site_logo,
		[]
	);
	return (
		<OptimizeControl
			attachmentId={ siteLogoId }
			onComplete={ ( media ) =>
				editEntityRecord( 'root', 'site', { site_logo: media.id } )
			}
		/>
	);
}

const BLOCK_CONTROLS = {
	'core/image': AttributeImageControl,
	'core/cover': AttributeImageControl,
	'core/media-text': MediaTextControl,
	'core/post-featured-image': FeaturedImageControl,
	'core/site-logo': SiteLogoControl,
};

/**
 * Adds an "Optimize" inspector control to supported media blocks, allowing
 * an already-uploaded image to be re-processed client-side.
 *
 * @param {Component} BlockEdit Original block edit component.
 * @return {Component} Wrapped component.
 */
const withOptimizeControl = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const BlockControl = BLOCK_CONTROLS[ props.name ];
		if (
			! BlockControl ||
			! props.isSelected ||
			! isOptimizationAvailable()
		) {
			return <BlockEdit { ...props } />;
		}

		return (
			<>
				<BlockEdit { ...props } />
				<BlockControl { ...props } />
			</>
		);
	},
	'withOptimizeControl'
);

addFilter(
	'editor.BlockEdit',
	'core/editor/optimize-media',
	withOptimizeControl
);
