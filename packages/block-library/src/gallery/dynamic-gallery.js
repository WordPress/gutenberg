import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	Button,
	Notice,
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
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { sharedIcon } from './shared-icon';
import { Caption } from '../utils/caption';
import {
	DEFAULT_ORDERBY,
	DEFAULT_ORDER,
	MAX_IMAGES,
	MEDIA_FOLDER,
	getDynamicSource,
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
 * Every media folder, alphabetically — the options for the folder chooser below.
 * Matches the query the inserter's folder categories use, so both read from one
 * resolved list rather than issuing separate requests.
 */
const MEDIA_FOLDERS_QUERY = {
	per_page: -1,
	hide_empty: false,
	orderby: 'name',
	order: 'asc',
};

/**
 * "Folder" control for a media folder gallery: which folder's images to show.
 *
 * Unlike the ordering control this isn't an optional setting — a folder gallery
 * with no folder resolves to nothing — so it renders as a plain control rather
 * than a resettable `ToolsPanelItem`.
 *
 * @param {Object}   props
 * @param {?number}  props.folderId  The currently selected folder id.
 * @param {Function} props.onChange  Called with the new folder id (or `undefined`).
 * @param {string}   props.label     The control's label.
 * @param {string}   props.noneLabel Placeholder option copy for "no folder chosen".
 */
function FolderControl( { folderId, onChange, label, noneLabel } ) {
	const folders = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords(
				'taxonomy',
				'wp_media_folder',
				MEDIA_FOLDERS_QUERY
			),
		[]
	);

	const options = [
		// Keeps the control usable before a folder is chosen, and lets a chosen
		// one be cleared again.
		{ label: noneLabel, value: '' },
		...( folders ?? [] ).map( ( folder ) => ( {
			label: decodeEntities( folder.name ),
			value: String( folder.id ),
		} ) ),
	];

	// A folder that has since been deleted (or isn't readable) leaves an id with
	// no matching option. Surface it rather than silently snapping the control
	// back to "no folder", which would misrepresent what the block is set to.
	const hasSelection = folderId !== undefined && folderId !== null;
	const isMissing =
		hasSelection &&
		!! folders &&
		! folders.some( ( folder ) => folder.id === folderId );

	return (
		<>
			<SelectControl
				label={ label }
				value={ hasSelection ? String( folderId ) : '' }
				options={
					isMissing
						? [
								...options,
								{
									label: __( 'Folder not found' ),
									value: String( folderId ),
								},
						  ]
						: options
				}
				onChange={ ( value ) =>
					onChange( value ? Number( value ) : undefined )
				}
			/>
			{ isMissing && (
				<Notice
					className="wp-block-gallery__source-notice"
					status="warning"
					isDismissible={ false }
				>
					{ __(
						'The selected folder no longer exists. Choose another folder to display images.'
					) }
				</Notice>
			) }
		</>
	);
}

/**
 * Confirmation for leaving dynamic mode, shown from both the block toolbar and
 * the Source panel so the two entry points explain the change identically.
 *
 * Detaching keeps the images the gallery currently shows but breaks the link to
 * its source, so it's worth confirming — mirroring the dialog `GallerySourcePanel`
 * shows for the opposite direction.
 *
 * @param {Object}   props
 * @param {Function} props.onConfirm Called when the user confirms detaching.
 * @param {Function} props.onCancel  Called when the user dismisses the dialog.
 */
function DetachGalleryDialog( { onConfirm, onCancel } ) {
	return (
		<ConfirmDialog
			isOpen
			title={ __( 'Detach Gallery' ) }
			__experimentalHideHeader={ false }
			confirmButtonText={ __( 'Detach' ) }
			onConfirm={ onConfirm }
			onCancel={ onCancel }
			size="medium"
		>
			{ __(
				'The gallery displays the images attached to the post. Detaching will enable you to add, delete, or reorder images. However, new attachments will no longer be added automatically.'
			) }
		</ConfirmDialog>
	);
}

/**
 * The Gallery block's "Source" inspector panel.
 *
 * In dynamic mode it shows the resolved source, a control to detach the gallery
 * from it, and the source ordering. In static mode it offers the entry point
 * into dynamic mode. Either direction is a one-way change, so both are behind a
 * confirmation dialog this panel owns. Rendered inside the block's
 * `InspectorControls`, alongside the Settings panel.
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
		canUseDynamicSource,
		availableSources,
		sourceDescriptor,
		sourceOrderby,
		sourceOrder,
		setSourceOrder,
		sourceFolderId,
		setSourceFolderId,
		convertToStatic,
		enableDynamicMode,
		resetSource,
		isResolvingDynamic,
		hasMoreImagesThanCap,
		dynamicMediaTotal,
	} = dynamic;
	const isDynamic = !! dynamicContent;

	// The source awaiting confirmation, set only while the dialog is open.
	const [ sourcePendingConfirm, setSourcePendingConfirm ] = useState();
	const [ isConfirmingDetach, setIsConfirmingDetach ] = useState( false );

	// Entering dynamic mode discards any hand-added images, so confirm first
	// when there are images to lose; otherwise switch straight away.
	function requestEnableDynamicMode( source ) {
		if ( hasImages ) {
			setSourcePendingConfirm( source );
		} else {
			enableDynamicMode( source );
		}
	}

	if ( isDynamic ) {
		return (
			<>
				<ToolsPanel
					label={ __( 'Source' ) }
					resetAll={ resetSource }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<div className="wp-block-gallery__source-settings">
						<p className="wp-block-gallery__source-description">
							{ sourceDescriptor?.description ??
								__( 'Dynamic images.' ) }
						</p>
						<Button
							__next40pxDefaultSize
							variant="secondary"
							onClick={ () => setIsConfirmingDetach( true ) }
							// Guard the race where the media is still resolving:
							// detaching now would map over an incomplete (or
							// empty) list and produce a gallery missing images.
							disabled={ isResolvingDynamic }
							accessibleWhenDisabled
						>
							{ __( 'Detach Gallery' ) }
						</Button>
						{ dynamicContent.source === MEDIA_FOLDER && (
							<FolderControl
								folderId={ sourceFolderId }
								onChange={ setSourceFolderId }
								label={ sourceDescriptor.selectFolderLabel }
								noneLabel={ sourceDescriptor.noFolderMessage }
							/>
						) }
					</div>
					{ hasMoreImagesThanCap && (
						<Notice
							className="wp-block-gallery__source-notice"
							status="warning"
							isDismissible={ false }
						>
							{ sprintf(
								/* translators: 1: number of images shown. 2: total number of matching images. */
								__(
									'Only the first %1$d of %2$d images will be displayed.'
								),
								MAX_IMAGES,
								dynamicMediaTotal
							) }
						</Notice>
					) }
					<ToolsPanelItem
						isShownByDefault
						label={ __( 'Order by' ) }
						hasValue={ () =>
							sourceOrderby !== DEFAULT_ORDERBY ||
							sourceOrder !== DEFAULT_ORDER
						}
						onDeselect={ () =>
							setSourceOrder( undefined, undefined )
						}
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
				{ isConfirmingDetach && (
					<DetachGalleryDialog
						onConfirm={ () => {
							convertToStatic();
							setIsConfirmingDetach( false );
						} }
						onCancel={ () => setIsConfirmingDetach( false ) }
					/>
				) }
			</>
		);
	}

	// In static mode this panel is just an entry into dynamic mode, so hide it
	// when there's no post type to preview against. This is intentionally
	// stricter than the placeholder's entry button (see `edit.js`), which stays
	// available anywhere because the source resolves at render time.
	if ( ! canUseDynamicSource ) {
		return null;
	}

	const pendingDescriptor = sourcePendingConfirm
		? getDynamicSource( sourcePendingConfirm )
		: undefined;

	return (
		<>
			<PanelBody title={ __( 'Source' ) }>
				<div className="wp-block-gallery__source-settings">
					{ /*
					 * One entry button per available source, each labelled with
					 * that source's own `title`. A list rather than a select:
					 * choosing a source is a one-way change that replaces the
					 * gallery's contents, so it reads better as an action than as
					 * a setting, and it keeps the confirmation attached to the
					 * thing being confirmed.
					 */ }
					{ availableSources.map( ( [ source, descriptor ] ) => (
						<Button
							key={ source }
							__next40pxDefaultSize
							variant="secondary"
							onClick={ () => requestEnableDynamicMode( source ) }
						>
							{ descriptor.title }
						</Button>
					) ) }
				</div>
			</PanelBody>
			{ pendingDescriptor && (
				<ConfirmDialog
					isOpen
					title={ pendingDescriptor.title }
					__experimentalHideHeader={ false }
					confirmButtonText={ __( 'Replace images' ) }
					onConfirm={ () => {
						enableDynamicMode( sourcePendingConfirm );
						setSourcePendingConfirm( undefined );
					} }
					onCancel={ () => setSourcePendingConfirm( undefined ) }
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
 * - a block-toolbar control to detach the gallery from its source, confirmed in
 *   a dialog;
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
		dynamicContent,
		sourceDescriptor,
		sourceFolderId,
		dynamicImageBlocks,
		galleryContext,
		isResolvingDynamic,
		convertToStatic,
	} = dynamic;

	// A folder gallery with no folder chosen yet isn't "empty" so much as
	// unconfigured, so it says what to do rather than what will appear.
	const needsFolder =
		dynamicContent?.source === MEDIA_FOLDER && ! sourceFolderId;

	// Detaching the gallery materializes editable inner blocks, which is a
	// structural change. Only offer it when the block is fully editable:
	// under a content lock (e.g. inside a `contentOnly` group) the editing mode
	// is `'contentOnly'`/`'disabled'`, where structural toolbar controls are
	// hidden and the conversion shouldn't be possible.
	const blockEditingMode = useBlockEditingMode();

	const [ isConfirmingDetach, setIsConfirmingDetach ] = useState( false );

	// Empty-state copy for the preview. Framed as forward-looking ("… will appear
	// here") rather than as an error, since the same empty result covers both a
	// post with no matching images and a template with no post in context yet —
	// in either case the source simply resolves to nothing right now. The per-
	// source wording comes from the source descriptor.
	let emptyInstructions;
	if ( needsFolder ) {
		emptyInstructions = sourceDescriptor.noFolderMessage;
	} else if ( isResolvingDynamic ) {
		emptyInstructions = __( 'Loading images…' );
	} else {
		emptyInstructions =
			sourceDescriptor?.emptyMessage ??
			__( 'Dynamic images will appear here.' );
	}

	return (
		<>
			{ blockEditingMode === 'default' && (
				<>
					<BlockControls group="other">
						<ToolbarButton
							onClick={ () => setIsConfirmingDetach( true ) }
							// Same guard as the inspector's "Detach Gallery": both end in
							// `convertToStatic`, which would map over a
							// still-resolving (or empty) media list.
							// (`ToolbarButton` stays focusable when disabled by
							// default.)
							disabled={ isResolvingDynamic }
						>
							{ __( 'Detach' ) }
						</ToolbarButton>
					</BlockControls>
					{ isConfirmingDetach && (
						<DetachGalleryDialog
							onConfirm={ () => {
								convertToStatic();
								setIsConfirmingDetach( false );
							} }
							onCancel={ () => setIsConfirmingDetach( false ) }
						/>
					) }
				</>
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
						instructions={ emptyInstructions }
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
