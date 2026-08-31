import type { ComponentType, ReactNode } from 'react';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import {
	InspectorControls,
	store as blockEditorStore,
	// @ts-expect-error `@wordpress/block-editor` does not expose type declarations for its entry point.
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

declare global {
	interface Window {
		__clientSideMediaProcessing?: boolean;
		__experimentalOptimizeExistingMedia?: boolean;
	}
}

/**
 * The subset of the newly created attachment needed to repoint a block.
 */
type OptimizedMedia = {
	id?: number;
	url?: string;
};

/**
 * Props every block edit component receives that these controls read from.
 */
type BlockEditProps = {
	name: string;
	clientId: string;
	isSelected?: boolean;
	attributes?: Record< string, any >;
	context?: {
		postId?: number;
		postType?: string;
	};
};

/**
 * Whether the client-side optimization control should be available.
 *
 * @return True when the "Optimize existing media" experiment is on and
 *         client-side media processing is enabled and supported.
 */
function isOptimizationAvailable(): boolean {
	return (
		typeof window !== 'undefined' &&
		Boolean( window.__experimentalOptimizeExistingMedia ) &&
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
 * @param props              Component props.
 * @param props.attachmentId Attachment ID to optimize.
 * @param props.onComplete   Called with the new attachment to repoint the block.
 * @return The control, or null when there is nothing to optimize.
 */
function OptimizeControl( {
	attachmentId,
	onComplete,
}: {
	attachmentId?: number;
	onComplete: ( media: OptimizedMedia ) => void;
} ): ReactNode {
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
			onSuccess: ( [ newMedia ]: OptimizedMedia[] ) => {
				if ( newMedia ) {
					onComplete( newMedia );
				}
				createSuccessNotice( __( 'Image optimized.' ), {
					type: 'snackbar',
				} );
			},
			onError: ( error: Error ) => {
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
 * @param props            Block edit props.
 * @param props.attributes Block attributes.
 * @param props.clientId   Block client ID.
 * @return The control.
 */
function AttributeImageControl( {
	attributes,
	clientId,
}: BlockEditProps ): ReactNode {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	return (
		<OptimizeControl
			attachmentId={ attributes?.id }
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
 * @param props            Block edit props.
 * @param props.attributes Block attributes.
 * @param props.clientId   Block client ID.
 * @return The control.
 */
function MediaTextControl( {
	attributes,
	clientId,
}: BlockEditProps ): ReactNode {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	if ( attributes?.mediaType !== 'image' ) {
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
 * @param props         Block edit props.
 * @param props.context Block context (postId, postType).
 * @return The control.
 */
function FeaturedImageControl( { context }: BlockEditProps ): ReactNode {
	const { postId, postType } = context || {};
	if ( ! postId || ! postType ) {
		return null;
	}
	return (
		<FeaturedImageOptimizeControl postId={ postId } postType={ postType } />
	);
}

/**
 * Resolves and optimizes the featured image of a known post.
 *
 * @param props          Component props.
 * @param props.postId   Post ID whose featured image should be optimized.
 * @param props.postType Post type of that post.
 * @return The control.
 */
function FeaturedImageOptimizeControl( {
	postId,
	postType,
}: {
	postId: number;
	postType: string;
} ): ReactNode {
	const [ featuredMedia, setFeaturedMedia ] = useEntityProp(
		'postType',
		postType,
		'featured_media',
		postId
	);
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
 * @return The control.
 */
function SiteLogoControl(): ReactNode {
	const { editEntityRecord } = useDispatch( coreStore );
	const siteLogoId = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecord< { site_logo?: number } >(
				'root',
				'site'
			)?.site_logo,
		[]
	);
	return (
		<OptimizeControl
			attachmentId={ siteLogoId }
			onComplete={ ( media ) =>
				editEntityRecord( 'root', 'site', undefined, {
					site_logo: media.id,
				} )
			}
		/>
	);
}

const BLOCK_CONTROLS: Record< string, ComponentType< BlockEditProps > > = {
	'core/image': AttributeImageControl,
	'core/cover': AttributeImageControl,
	'core/media-text': MediaTextControl,
	'core/post-featured-image': FeaturedImageControl,
	'core/site-logo': SiteLogoControl,
};

/**
 * Adds an "Optimize" inspector control to supported media blocks, allowing
 * an already-uploaded image to be re-processed client-side.
 */
const withOptimizeControl = createHigherOrderComponent(
	( BlockEdit: ComponentType< BlockEditProps > ) =>
		( props: BlockEditProps ) => {
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
