/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	Button,
	PanelBody,
	Placeholder,
	SelectControl,
	Spinner,
	ToolbarButton,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import {
	BlockContextProvider,
	BlockControls,
	useBlockEditingMode,
	__experimentalUseBlockPreview as useBlockPreview,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { sharedIcon } from './shared-icon';
import { Caption } from '../utils/caption';
import {
	getSourceDescription,
	DEFAULT_ORDERBY,
	DEFAULT_ORDER,
} from './dynamic-source';

/**
 * Ordering options for a dynamic gallery source. Each value is a composite
 * `"orderby/order"` string mapping to the matching `/wp/v2/media` collection
 * params. `menu_order` is deliberately omitted — it isn't a valid REST `orderby`
 * value, so the editor preview couldn't reproduce it (see `dynamic-source.js`).
 */
const ORDER_OPTIONS = [
	{ label: __( 'Newest to oldest' ), value: 'date/desc' },
	{ label: __( 'Oldest to newest' ), value: 'date/asc' },
	{
		/* translators: Label for ordering images by title in ascending order. */
		label: __( 'A → Z' ),
		value: 'title/asc',
	},
	{
		/* translators: Label for ordering images by title in descending order. */
		label: __( 'Z → A' ),
		value: 'title/desc',
	},
];

/**
 * "Order by" control for a dynamic gallery, mirroring the Query Loop block's
 * `OrderControl`: a single `SelectControl` whose value composites `orderby` and
 * `order`, split apart again on change.
 *
 * @param {Object}   props
 * @param {string}   props.orderby  Current `orderby` value.
 * @param {string}   props.order    Current `order` value (`asc`/`desc`).
 * @param {Function} props.onChange Called with `{ orderby, order }` on change.
 */
function OrderControl( { orderby, order, onChange } ) {
	return (
		<SelectControl
			__next40pxDefaultSize
			label={ __( 'Order by' ) }
			value={ `${ orderby }/${ order }` }
			options={ ORDER_OPTIONS }
			onChange={ ( value ) => {
				const [ newOrderby, newOrder ] = value.split( '/' );
				onChange( { orderby: newOrderby, order: newOrder } );
			} }
		/>
	);
}

/**
 * The Gallery block's "Source" inspector panel.
 *
 * In dynamic mode it shows the resolved source, a control to convert back to
 * individual images, and the source ordering. In static mode it offers the
 * entry point into dynamic mode — and, since switching discards any hand-added
 * images, owns the confirmation dialog for that one-way change. Rendered inside
 * the block's `InspectorControls`, alongside the Settings panel.
 *
 * @param {Object}  props
 * @param {Object}  props.dynamic           The `useDynamicGallery` result.
 * @param {Object}  props.dropdownMenuProps Shared ToolsPanel dropdown menu props.
 * @param {boolean} props.hasImages         Whether the gallery has manually-added images.
 */
export function GallerySourcePanel( {
	dynamic,
	dropdownMenuProps,
	hasImages,
} ) {
	const {
		dynamicContent,
		sourceOrderby,
		sourceOrder,
		setSourceOrder,
		convertToStatic,
		enableDynamicMode,
		resetSource,
	} = dynamic;
	const isDynamic = !! dynamicContent;

	const [ isConfirming, setIsConfirming ] = useState( false );

	// Entering dynamic mode discards any hand-added images, so confirm first
	// when there are images to lose; otherwise switch straight away.
	function requestEnableDynamicMode() {
		if ( hasImages ) {
			setIsConfirming( true );
		} else {
			enableDynamicMode();
		}
	}

	if ( isDynamic ) {
		return (
			<ToolsPanel
				label={ __( 'Source' ) }
				resetAll={ resetSource }
				dropdownMenuProps={ dropdownMenuProps }
			>
				<div className="wp-block-gallery__source-settings">
					<p className="wp-block-gallery__source-description">
						{ getSourceDescription( dynamicContent ) }
					</p>
					<Button
						__next40pxDefaultSize
						variant="secondary"
						onClick={ convertToStatic }
					>
						{ __( 'Convert to individual images' ) }
					</Button>
				</div>
				<ToolsPanelItem
					isShownByDefault
					label={ __( 'Order by' ) }
					hasValue={ () =>
						sourceOrderby !== DEFAULT_ORDERBY ||
						sourceOrder !== DEFAULT_ORDER
					}
					onDeselect={ () => setSourceOrder( undefined, undefined ) }
				>
					<OrderControl
						orderby={ sourceOrderby }
						order={ sourceOrder }
						onChange={ ( { orderby, order } ) =>
							setSourceOrder( orderby, order )
						}
					/>
				</ToolsPanelItem>
			</ToolsPanel>
		);
	}

	return (
		<>
			<PanelBody title={ __( 'Source' ) }>
				<div className="wp-block-gallery__source-settings">
					<Button
						__next40pxDefaultSize
						variant="secondary"
						onClick={ requestEnableDynamicMode }
					>
						{ __( 'Use images attached to the post' ) }
					</Button>
				</div>
			</PanelBody>
			{ isConfirming && (
				<ConfirmDialog
					isOpen
					title={ __( 'Use images attached to the post?' ) }
					__experimentalHideHeader={ false }
					confirmButtonText={ __( 'Use attached images' ) }
					onConfirm={ () => {
						enableDynamicMode();
						setIsConfirming( false );
					} }
					onCancel={ () => setIsConfirming( false ) }
					size="medium"
				>
					{ __(
						'The images in this gallery will be replaced, but will remain in the media library.'
					) }
				</ConfirmDialog>
			) }
		</>
	);
}

/**
 * Renders the resolved image blocks as a read-only preview.
 *
 * `useBlockPreview` returns a `useDisabled` ref that makes its subtree inert, so
 * previewed images (including any links) aren't interactive in the editor. The
 * ref needs a real element, yet the images must stay flex children of the gallery
 * `<figure>` and sit beside an editable caption. `display: contents` resolves
 * this: the wrapper carries the ref but generates no box, so the image figures
 * remain the figure's flex items and only they are disabled — the caption sibling
 * stays editable. This relies on the gallery's image styles using descendant
 * (not direct-child) selectors, which the box-less wrapper leaves intact.
 *
 * @param {Object}   props
 * @param {Object[]} props.imageBlocks Non-persisted `core/image` blocks to preview.
 */
function GalleryImagesPreview( { imageBlocks } ) {
	const { children, ref, className } = useBlockPreview( {
		blocks: imageBlocks,
	} );
	return (
		<div
			ref={ ref }
			className={ className }
			style={ { display: 'contents' } }
		>
			{ children }
		</div>
	);
}

/**
 * Renders a dynamic-mode gallery on the canvas:
 *
 * - a block-toolbar control to convert back to individual images;
 * - the gallery `<figure>` wrapper holding a non-editable preview of the
 *   resolved media (or a placeholder while resolving / when nothing is found),
 *   with the gallery's provided context so the previewed images inherit
 *   gallery-wide settings;
 * - an editable gallery-level caption, alongside the read-only preview;
 * - the (empty) inner blocks kept mounted so the container's `allowedBlocks: []`
 *   keeps syncing to block list settings (which blocks insertion and hides the
 *   List View).
 *
 * @param {Object}   props
 * @param {Object}   props.dynamic               The `useDynamicGallery` result.
 * @param {Object}   props.blockProps            The gallery's `useBlockProps()` result.
 * @param {Object}   props.innerBlocksProps      The gallery's `useInnerBlocksProps()` result.
 * @param {Object}   props.attributes            The gallery block attributes.
 * @param {Function} props.setAttributes         The block's `setAttributes`.
 * @param {boolean}  props.isSelected            Whether the gallery block is selected.
 * @param {Function} props.insertBlocksAfter     Inserts blocks after the gallery.
 * @param {boolean}  props.isContentLocked       Whether the gallery is content-locked.
 * @param {boolean}  props.multiGallerySelection Whether multiple galleries are selected.
 */
export function GalleryDynamicView( {
	dynamic,
	blockProps,
	innerBlocksProps,
	attributes,
	setAttributes,
	isSelected,
	insertBlocksAfter,
	isContentLocked,
	multiGallerySelection,
} ) {
	const {
		dynamicImageBlocks,
		galleryContext,
		isResolvingDynamic,
		convertToStatic,
	} = dynamic;

	// Converting to a static gallery materializes editable inner blocks, which
	// is a structural change. Only offer it when the block is fully editable:
	// under a content lock (e.g. inside a `contentOnly` group) the editing mode
	// is `'contentOnly'`/`'disabled'`, where structural toolbar controls are
	// hidden and the conversion shouldn't be possible.
	const blockEditingMode = useBlockEditingMode();

	return (
		<>
			{ blockEditingMode === 'default' && (
				<BlockControls group="other">
					<ToolbarButton onClick={ convertToStatic }>
						{ __( 'Edit images' ) }
					</ToolbarButton>
				</BlockControls>
			) }
			<figure { ...blockProps }>
				{ dynamicImageBlocks.length ? (
					<BlockContextProvider value={ galleryContext }>
						<GalleryImagesPreview
							imageBlocks={ dynamicImageBlocks }
						/>
					</BlockContextProvider>
				) : (
					<Placeholder
						icon={ sharedIcon }
						label={ __( 'Gallery' ) }
						instructions={
							isResolvingDynamic
								? __( 'Loading attached images…' )
								: __(
										'No images are attached to the post yet.'
								  )
						}
					>
						{ isResolvingDynamic && <Spinner /> }
					</Placeholder>
				) }
				<Caption
					attributes={ attributes }
					setAttributes={ setAttributes }
					isSelected={ isSelected }
					insertBlocksAfter={ insertBlocksAfter }
					showToolbarButton={
						! multiGallerySelection && ! isContentLocked
					}
					className="blocks-gallery-caption"
					label={ __( 'Gallery caption text' ) }
					placeholder={ __( 'Add gallery caption' ) }
				/>
			</figure>
			{ /*
			 * Dynamic mode shows a preview instead of real inner blocks, but the
			 * empty inner blocks are still rendered here for their side effect:
			 * the `allowedBlocks: []` passed to `useInnerBlocksProps` only syncs
			 * to block list settings while the inner blocks are mounted (via
			 * `useNestedSettingsUpdate`). That setting is what blocks insertion
			 * (`canInsertBlockType`) and hides the now-unusable List View
			 * (`shouldRenderBlockListView`). With no inner blocks and no appender,
			 * this renders no output of its own.
			 */ }
			{ innerBlocksProps.children }
		</>
	);
}
