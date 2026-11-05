import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import {
	Button,
	Notice as WCNotice,
	PanelBody,
	Placeholder,
	Spinner as WCSpinner,
	ToolbarButton,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import {
	BlockContextProvider,
	BlockControls,
	useBlockEditingMode,
	__experimentalUseBlockPreview as useBlockPreview,
} from '@wordpress/block-editor';
import { sharedIcon } from './shared-icon';
import { isGalleryFlexLayout } from './shared';
import { Caption } from '../utils/caption';
import FolderControl from './folder-control';
import { MAX_IMAGES, MEDIA_FOLDER, getDynamicSource } from './dynamic-source';

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
 * In dynamic mode it shows the resolved source and a control to detach the
 * gallery from it. In static mode it offers the entry point into dynamic mode.
 * Either direction is a one-way change, so both are behind a confirmation
 * dialog this panel owns. Rendered inside the block's `InspectorControls`,
 * alongside the Settings panel, which owns the ordering for both modes.
 *
 * @param {Object}  props
 * @param {Object}  props.dynamic   The `useDynamicGallery` result.
 * @param {boolean} props.hasImages Whether the gallery has manually-added images.
 */
export function GallerySourcePanel( { dynamic, hasImages } ) {
	const {
		dynamicContent,
		canUseDynamicSource,
		availableSources,
		sourceDescriptor,
		sourceFolderId,
		setSourceFolderId,
		convertToStatic,
		enableDynamicMode,
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
				<PanelBody title={ __( 'Source' ) }>
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
							/>
						) }
					</div>
					{ hasMoreImagesThanCap && (
						<WCNotice
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
						</WCNotice>
					) }
				</PanelBody>
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
	// stricter than the placeholder's entry button (see `edit.jsx`), which stays
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
					<p className="wp-block-gallery__source-description">
						{ __( 'Images added to the gallery.' ) }
					</p>
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
 * The gallery's layout is passed through so the previewed images see the same
 * parent layout that real inner blocks would (`useBlockPreview` provides it to
 * their layout context). Without it they resolve to the default flow layout and
 * behave as if they weren't in a gallery — most visibly, an image inside a
 * cropped gallery would keep its baseline `height: auto` and defeat the
 * gallery's cropping CSS.
 *
 * @param {Object}   props
 * @param {Object[]} props.imageBlocks Non-persisted `core/image` blocks to preview.
 * @param {Object}   props.layout      The gallery's layout, for the preview's layout context.
 */
function GalleryImagesPreview( { imageBlocks, layout } ) {
	const { children, ref, className } = useBlockPreview( {
		blocks: imageBlocks,
		layout,
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

	// A folder gallery with no folder chosen yet isn't so much empty as
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

	// The layout the previewed images sit in. Normalized the same way the
	// gallery's own classes are (`isGalleryFlexLayout`), so a layout that the
	// wrapper treats as flex — including a missing or typeless one — is reported
	// as flex to the images rather than resolving to the default flow layout.
	// Memoized because it becomes the preview's layout context value.
	const previewLayout = useMemo(
		() =>
			isGalleryFlexLayout( attributes.layout )
				? { ...attributes.layout, type: 'flex' }
				: attributes.layout,
		[ attributes.layout ]
	);

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
							layout={ previewLayout }
						/>
					</BlockContextProvider>
				) : (
					<Placeholder
						icon={ sharedIcon }
						label={ __( 'Gallery' ) }
						instructions={ emptyInstructions }
					>
						{ isResolvingDynamic && <WCSpinner /> }
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
