import {
	ToggleControl,
	RangeControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import {
	store as blockEditorStore,
	useSettings,
} from '@wordpress/block-editor';
import { SelectControl } from '@wordpress/ui';
import { __, _x, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import {
	defaultColumnsNumber,
	getAspectRatioAttributes,
	isGalleryFlexLayout,
} from './shared';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import {
	getUpdatedLinkTargetSettings,
	getImageSizeAttributes,
} from '../image/utils';
import {
	LINK_DESTINATION_LIGHTBOX,
	DEFAULT_MEDIA_SIZE_SLUG,
	MAX_COLUMNS,
} from './constants';
import { SortImagesControl, SourceOrderControl } from './order-controls';
import { DEFAULT_ORDERBY, DEFAULT_ORDER } from './dynamic-source';
import { hasSortableImages, sortImageBlocks } from './order-images';
import {
	getViewportGalleryStyle,
	getUpdatedGalleryStyle,
	isValidGalleryColumns,
} from './responsive-styles';

const NAVIGATION_BUTTON_TYPE_OPTIONS = [
	{
		label: __( 'Icon' ),
		value: 'icon',
	},
	{
		label: __( 'Text' ),
		value: 'text',
	},
	{
		label: __( 'Both' ),
		value: 'both',
	},
];

/**
 * Returns the 'Resolution' options: the image sizes at least one image has.
 *
 * @param {Array} media      Media items of the gallery images.
 * @param {Array} imageSizes Image sizes from the block editor settings.
 *
 * @return {Array} Image size options.
 */
function getImageSizeOptions( media, imageSizes ) {
	return imageSizes.reduce( ( options, { name, slug } ) => {
		const hasSize = media.some(
			( image ) =>
				image.id &&
				( image.sizes?.[ slug ]?.url ||
					image.media_details?.sizes?.[ slug ]?.source_url )
		);
		if ( hasSize ) {
			options.push( { value: slug, label: name } );
		}
		return options;
	}, [] );
}

export default function GalleryControls( {
	attributes,
	setAttributes,
	clientId,
	viewport,
	innerBlockImages,
	mediaById,
	dynamic,
	updateInnerImages,
	appliedSort,
	setAppliedSort,
} ) {
	const {
		navigationButtonType,
		columns,
		imageCrop,
		randomOrder,
		linkTarget,
		linkTo,
		sizeSlug,
		aspectRatio,
		layout,
	} = attributes;
	const isDynamic = !! attributes.dynamicContent;
	const isFlexLayout = isGalleryFlexLayout( layout );
	const isViewportStyleState = !! viewport;

	const [ lightboxSetting, defaultRatios, themeRatios, showDefaultRatios ] =
		useSettings(
			'blocks.core/image.lightbox',
			'dimensions.aspectRatios.default',
			'dimensions.aspectRatios.theme',
			'dimensions.defaultAspectRatios'
		);
	const imageSizes = useSelect(
		( select ) => select( blockEditorStore ).getSettings().imageSizes,
		[]
	);
	const { getBlocks } = useSelect( blockEditorStore );
	const { __unstableMarkNextChangeAsNotPersistent, replaceInnerBlocks } =
		useDispatch( blockEditorStore );
	const { createSuccessNotice } = useDispatch( noticesStore );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const themeOptions = themeRatios?.map( ( { name, ratio } ) => ( {
		label: name,
		value: ratio,
	} ) );
	const defaultOptions = defaultRatios?.map( ( { name, ratio } ) => ( {
		label: name,
		value: ratio,
	} ) );
	const aspectRatioOptions = [
		{
			label: _x(
				'Original',
				'Aspect ratio option for dimensions control'
			),
			value: 'auto',
		},
		...( showDefaultRatios ? defaultOptions || [] : [] ),
		...( themeOptions || [] ),
	];

	// Columns and crop to fit are Flex-only, so a Gallery in another layout has
	// viewport settings to show only when aspect ratios are available. Without
	// this the viewport Settings panel would render empty.
	const hasViewportSettings = isFlexLayout || aspectRatioOptions.length > 1;
	if ( isViewportStyleState && ! hasViewportSettings ) {
		return null;
	}

	const viewportStyle = isViewportStyleState
		? getViewportGalleryStyle( attributes.style, viewport )
		: {};
	const baseColumns = isValidGalleryColumns( columns ) ? columns : undefined;
	const baseImageCrop = typeof imageCrop === 'boolean' ? imageCrop : true;
	// Normalized so a Gallery with no aspect ratio and one explicitly set to
	// Original compare equal, and a viewport override matching either is
	// dropped rather than stored.
	const baseAspectRatio = aspectRatio || 'auto';
	const hasViewportColumns =
		isViewportStyleState &&
		Object.hasOwn( viewportStyle, 'columns' ) &&
		isValidGalleryColumns( viewportStyle.columns );
	const hasViewportImageCrop =
		isViewportStyleState &&
		Object.hasOwn( viewportStyle, 'imageCrop' ) &&
		typeof viewportStyle.imageCrop === 'boolean';
	const hasViewportAspectRatio =
		isViewportStyleState &&
		Object.hasOwn( viewportStyle, 'aspectRatio' ) &&
		typeof viewportStyle.aspectRatio === 'string' &&
		!! viewportStyle.aspectRatio;
	const activeColumns = hasViewportColumns
		? viewportStyle.columns
		: baseColumns;
	const activeImageCrop = hasViewportImageCrop
		? viewportStyle.imageCrop
		: baseImageCrop;
	const activeAspectRatio = hasViewportAspectRatio
		? viewportStyle.aspectRatio
		: baseAspectRatio;

	const currentOrder =
		appliedSort &&
		appliedSort.clientIds.length === innerBlockImages.length &&
		appliedSort.clientIds.every(
			( id, index ) => innerBlockImages[ index ].clientId === id
		)
			? appliedSort.order
			: null;
	const canSortImages = hasSortableImages( innerBlockImages, mediaById );

	// State that drives counts/size options should reflect the dynamic media
	// when the gallery is in dynamic mode.
	const displayedImageCount = isDynamic
		? dynamic.dynamicMedia.length
		: innerBlockImages.length;

	// Check if there is at least one image with lightbox enabled. In dynamic
	// mode the images inherit the gallery's link setting, so the lightbox is on
	// when the gallery links images to the lightbox.
	let hasLightboxImages;
	if ( isDynamic ) {
		hasLightboxImages = linkTo === LINK_DESTINATION_LIGHTBOX;
	} else if ( lightboxSetting?.enabled ) {
		hasLightboxImages = innerBlockImages.some(
			( block ) =>
				block.attributes?.lightbox?.enabled === undefined ||
				block.attributes?.lightbox?.enabled === true
		);
	} else {
		hasLightboxImages = innerBlockImages.some(
			( block ) => block.attributes.lightbox?.enabled
		);
	}

	const imageSizeOptions = getImageSizeOptions(
		isDynamic ? dynamic.dynamicMedia : Array.from( mediaById.values() ),
		imageSizes
	);

	function selectRandomOrder() {
		setAttributes( { randomOrder: true } );
	}

	// Choosing any other order turns "Random" off. Called straight after the
	// edit that applies the order, and marked non-persistent so the two writes
	// share one undo level: a single undo restores both the order and Random.
	function clearRandomOrderAfterEdit() {
		if ( randomOrder ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { randomOrder: false } );
		}
	}

	// Reorders the inner image blocks in place. Left persistent on purpose so
	// the sort is a single undoable step.
	function sortImages( order ) {
		const sortedBlocks = sortImageBlocks(
			getBlocks( clientId ),
			mediaById,
			order
		);
		replaceInnerBlocks( clientId, sortedBlocks );
		clearRandomOrderAfterEdit();
		setAppliedSort( {
			order,
			clientIds: sortedBlocks.map( ( block ) => block.clientId ),
		} );
	}

	// "Custom" is the order arranged in the editor: it turns Random off and
	// forgets any sort applied earlier, so the control reads "Custom" from
	// here on rather than that sort.
	function selectCustomOrder() {
		setAttributes( { randomOrder: false } );
		setAppliedSort( null );
	}

	function changeSourceOrder( { orderby, order } ) {
		dynamic.setSourceOrder( orderby, order );
		clearRandomOrderAfterEdit();
	}

	function setGallerySettings( settings ) {
		if ( ! isViewportStyleState ) {
			setAttributes( settings );
			return;
		}

		setAttributes( {
			style: getUpdatedGalleryStyle( {
				style: attributes.style,
				viewport,
				baseSettings: {
					columns: baseColumns,
					imageCrop: baseImageCrop,
					aspectRatio: baseAspectRatio,
				},
				settings,
			} ),
		} );
	}

	function setColumnsNumber( value ) {
		setGallerySettings( { columns: value } );
	}

	function toggleImageCrop() {
		setGallerySettings( { imageCrop: ! activeImageCrop } );
	}

	function toggleOpenInNewTab( openInNewTab ) {
		const newLinkTarget = openInNewTab ? '_blank' : undefined;
		setAttributes( { linkTarget: newLinkTarget } );
		updateInnerImages( ( block ) =>
			getUpdatedLinkTargetSettings( newLinkTarget, block.attributes )
		);
		const noticeText = openInNewTab
			? __( 'All gallery images updated to open in new tab' )
			: __( 'All gallery images updated to not open in new tab' );
		createSuccessNotice( noticeText, {
			id: 'gallery-attributes-openInNewTab',
			type: 'snackbar',
		} );
	}

	function updateImagesSize( newSizeSlug ) {
		setAttributes( { sizeSlug: newSizeSlug } );
		updateInnerImages( ( block, media ) =>
			getImageSizeAttributes( media, newSizeSlug )
		);
		const imageSize = imageSizeOptions.find(
			( size ) => size.value === newSizeSlug
		);

		createSuccessNotice(
			sprintf(
				/* translators: %s: image size settings */
				__( 'All gallery image sizes updated to: %s' ),
				imageSize?.label ?? newSizeSlug
			),
			{
				id: 'gallery-attributes-sizeSlug',
				type: 'snackbar',
			}
		);
	}

	/**
	 * Sets the Gallery's aspect ratio.
	 *
	 * The base value is added to the img element as an inline
	 * style. A viewport value is instead rendered
	 * from the Gallery's responsive CSS, which overrides that inline style.
	 *
	 * @param {string|undefined} value Aspect ratio to set. In a viewport state
	 *                                 `'auto'` is an override that cancels the
	 *                                 base ratio, while `undefined` removes the
	 *                                 override so the base value applies again.
	 */
	function setAspectRatio( value ) {
		if ( isViewportStyleState ) {
			setGallerySettings( { aspectRatio: value } );
		} else {
			setAttributes( { aspectRatio: value ?? 'auto' } );
			updateInnerImages( () => getAspectRatioAttributes( value ) );
		}

		const noticeValue = value ?? baseAspectRatio;
		const aspectRatioText = aspectRatioOptions.find(
			( option ) => option.value === noticeValue
		);
		const noticeText = isViewportStyleState
			? sprintf(
					/* translators: 1: viewport name, 2: aspect ratio setting */
					__(
						'Gallery images in the %1$s viewport updated to aspect ratio: %2$s'
					),
					viewport.replace( '@', '' ),
					aspectRatioText?.label || noticeValue
				)
			: sprintf(
					/* translators: %s: aspect ratio setting */
					__( 'All gallery images updated to aspect ratio: %s' ),
					aspectRatioText?.label || noticeValue
				);

		createSuccessNotice( noticeText, {
			id: 'gallery-attributes-aspectRatio',
			type: 'snackbar',
		} );
	}

	function resetAll() {
		if ( isViewportStyleState ) {
			setGallerySettings( {
				columns: undefined,
				imageCrop: undefined,
				aspectRatio: undefined,
			} );
			return;
		}

		setAttributes( {
			navigationButtonType: 'icon',
			randomOrder: false,
			...( isFlexLayout && {
				columns: undefined,
				imageCrop: true,
			} ),
		} );

		setAspectRatio( 'auto' );

		if ( isDynamic ) {
			dynamic.setSourceOrder( undefined, undefined );
		}

		if ( sizeSlug !== DEFAULT_MEDIA_SIZE_SLUG ) {
			updateImagesSize( DEFAULT_MEDIA_SIZE_SLUG );
		}

		if ( linkTarget ) {
			toggleOpenInNewTab( false );
		}
	}

	const hasLinkTo = linkTo && linkTo !== 'none';

	return (
		<ToolsPanel
			label={ __( 'Settings' ) }
			resetAll={ resetAll }
			dropdownMenuProps={ dropdownMenuProps }
		>
			{ isFlexLayout && displayedImageCount > 1 && (
				<ToolsPanelItem
					isShownByDefault
					label={ __( 'Columns' ) }
					hasValue={ () =>
						isViewportStyleState
							? hasViewportColumns
							: !! activeColumns &&
								activeColumns !== displayedImageCount
					}
					onDeselect={ () => setColumnsNumber( undefined ) }
				>
					<RangeControl
						label={ __( 'Columns' ) }
						value={
							activeColumns
								? activeColumns
								: defaultColumnsNumber( displayedImageCount )
						}
						onChange={ setColumnsNumber }
						min={ 1 }
						max={ Math.min( MAX_COLUMNS, displayedImageCount ) }
						required
					/>
				</ToolsPanelItem>
			) }
			{ ! isViewportStyleState && (
				// "Random" is stored in both modes. Beyond that, a
				// dynamic gallery's order is a stored query setting,
				// while a static gallery's orders are one-off actions.
				<ToolsPanelItem
					isShownByDefault
					label={ __( 'Order by' ) }
					hasValue={ () =>
						!! randomOrder ||
						( isDynamic &&
							( dynamic.sourceOrderby !== DEFAULT_ORDERBY ||
								dynamic.sourceOrder !== DEFAULT_ORDER ) )
					}
					onDeselect={ () => {
						if ( isDynamic ) {
							// Two writes, folded into one undo level.
							dynamic.setSourceOrder( undefined, undefined );
							clearRandomOrderAfterEdit();
						} else {
							selectCustomOrder();
						}
					} }
				>
					{ isDynamic ? (
						<SourceOrderControl
							order={ {
								orderby: dynamic.sourceOrderby,
								order: dynamic.sourceOrder,
							} }
							isRandom={ !! randomOrder }
							onChange={ changeSourceOrder }
							onSelectRandom={ selectRandomOrder }
						/>
					) : (
						<SortImagesControl
							currentOrder={ currentOrder }
							isRandom={ !! randomOrder }
							canSort={ canSortImages }
							onSort={ sortImages }
							onSelectCustom={ selectCustomOrder }
							onSelectRandom={ selectRandomOrder }
						/>
					) }
				</ToolsPanelItem>
			) }
			{ ! isViewportStyleState && imageSizeOptions.length > 0 && (
				<ToolsPanelItem
					isShownByDefault
					label={ __( 'Resolution' ) }
					hasValue={ () => sizeSlug !== DEFAULT_MEDIA_SIZE_SLUG }
					onDeselect={ () =>
						updateImagesSize( DEFAULT_MEDIA_SIZE_SLUG )
					}
				>
					<SelectControl
						label={ __( 'Resolution' ) }
						description={ __(
							'Select the size of the source images.'
						) }
						value={
							imageSizeOptions.find(
								( item ) => item.value === sizeSlug
							) ?? imageSizeOptions[ 0 ]
						}
						items={ imageSizeOptions }
						onValueChange={ ( item ) => {
							if ( item && item.value !== sizeSlug ) {
								updateImagesSize( item.value );
							}
						} }
					/>
				</ToolsPanelItem>
			) }
			{ ! isViewportStyleState && hasLinkTo && (
				<ToolsPanelItem
					isShownByDefault
					label={ __( 'Open images in new tab' ) }
					hasValue={ () => !! linkTarget }
					onDeselect={ () => toggleOpenInNewTab( false ) }
				>
					<ToggleControl
						label={ __( 'Open images in new tab' ) }
						checked={ linkTarget === '_blank' }
						onChange={ toggleOpenInNewTab }
					/>
				</ToolsPanelItem>
			) }
			{ aspectRatioOptions.length > 1 && (
				<ToolsPanelItem
					hasValue={ () =>
						isViewportStyleState
							? hasViewportAspectRatio
							: activeAspectRatio !== 'auto'
					}
					label={ __( 'Aspect ratio' ) }
					onDeselect={ () =>
						// In a viewport state this clears the override
						// so the base ratio applies again, rather than
						// overriding it with Original.
						setAspectRatio(
							isViewportStyleState ? undefined : 'auto'
						)
					}
					isShownByDefault
				>
					<SelectControl
						label={ __( 'Aspect ratio' ) }
						description={ __(
							'Set a consistent aspect ratio for all images in the gallery.'
						) }
						value={
							aspectRatioOptions.find(
								( item ) => item.value === activeAspectRatio
							) ?? aspectRatioOptions[ 0 ]
						}
						items={ aspectRatioOptions }
						onValueChange={ ( item ) => {
							if ( item && item.value !== activeAspectRatio ) {
								setAspectRatio( item.value );
							}
						} }
					>
						{ aspectRatioOptions.map( ( item, index ) => (
							<SelectControl.Item
								key={ `${ item.value }-${ index }` }
								value={ item }
								label={ item.label }
							>
								<SelectControl.ItemLabel>
									{ item.label }
								</SelectControl.ItemLabel>
							</SelectControl.Item>
						) ) }
					</SelectControl>
				</ToolsPanelItem>
			) }
			{ isFlexLayout && (
				<ToolsPanelItem
					isShownByDefault
					label={ __( 'Crop images to fit' ) }
					hasValue={ () =>
						isViewportStyleState
							? hasViewportImageCrop
							: ! activeImageCrop
					}
					onDeselect={ () =>
						setGallerySettings( {
							imageCrop: isViewportStyleState ? undefined : true,
						} )
					}
				>
					<ToggleControl
						label={ __( 'Crop images to fit' ) }
						checked={ activeImageCrop }
						onChange={ toggleImageCrop }
					/>
				</ToolsPanelItem>
			) }
			{ ! isViewportStyleState &&
				lightboxSetting?.allowEditing &&
				hasLightboxImages && (
					<ToolsPanelItem
						label={ __( 'Navigation button type' ) }
						isShownByDefault
						hasValue={ () => navigationButtonType !== 'icon' }
						onDeselect={ () =>
							setAttributes( {
								navigationButtonType: 'icon',
							} )
						}
					>
						<ToggleGroupControl
							label={ __( 'Navigation button type' ) }
							value={ navigationButtonType }
							onChange={ ( value ) =>
								setAttributes( {
									navigationButtonType: value,
								} )
							}
							isBlock
							help={ __(
								'Adjust the appearance of buttons in the lightbox.'
							) }
						>
							{ NAVIGATION_BUTTON_TYPE_OPTIONS.map(
								( option ) => (
									<ToggleGroupControlOption
										key={ option.value }
										value={ option.value }
										label={ option.label }
									/>
								)
							) }
						</ToggleGroupControl>
					</ToolsPanelItem>
				) }
		</ToolsPanel>
	);
}
