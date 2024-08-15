/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useCallback,
	useState,
	useEffect,
	useRef,
	Platform,
} from '@wordpress/element';
import {
	InspectorControls,
	useBlockProps,
	RecursionProvider,
	useHasRecursion,
	store as blockEditorStore,
	withColors,
	ContrastChecker,
	getColorClassName,
	Warning,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { EntityProvider, store as coreStore } from '@wordpress/core-data';

import { useDispatch, useSelect } from '@wordpress/data';
import {
	PanelBody,
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	Button,
	Spinner,
	Notice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { close, Icon } from '@wordpress/icons';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import useNavigationMenu from '../use-navigation-menu';
import useNavigationEntities from '../use-navigation-entities';
import Placeholder from './placeholder';
import ResponsiveWrapper from './responsive-wrapper';
import NavigationInnerBlocks from './inner-blocks';
import NavigationMenuNameControl from './navigation-menu-name-control';
import UnsavedInnerBlocks from './unsaved-inner-blocks';
import NavigationMenuDeleteControl from './navigation-menu-delete-control';
import useNavigationNotice from './use-navigation-notice';
import OverlayMenuIcon from './overlay-menu-icon';
import OverlayMenuPreview from './overlay-menu-preview';
import useConvertClassicToBlockMenu, {
	CLASSIC_MENU_CONVERSION_ERROR,
	CLASSIC_MENU_CONVERSION_PENDING,
	CLASSIC_MENU_CONVERSION_SUCCESS,
} from './use-convert-classic-menu-to-block-menu';
import useCreateNavigationMenu from './use-create-navigation-menu';
import { useInnerBlocks } from './use-inner-blocks';
import { detectColors } from './utils';
import ManageMenusButton from './manage-menus-button';
import MenuInspectorControls from './menu-inspector-controls';
import DeletedNavigationWarning from './deleted-navigation-warning';
import AccessibleDescription from './accessible-description';
import AccessibleMenuDescription from './accessible-menu-description';
import { unlock } from '../../lock-unlock';

function ColorTools( {
	textColor,
	setTextColor,
	backgroundColor,
	setBackgroundColor,
	overlayTextColor,
	setOverlayTextColor,
	overlayBackgroundColor,
	setOverlayBackgroundColor,
	clientId,
	navRef,
} ) {
	const [ detectedBackgroundColor, setDetectedBackgroundColor ] = useState();
	const [ detectedColor, setDetectedColor ] = useState();
	const [
		detectedOverlayBackgroundColor,
		setDetectedOverlayBackgroundColor,
	] = useState();
	const [ detectedOverlayColor, setDetectedOverlayColor ] = useState();
	// Turn on contrast checker for web only since it's not supported on mobile yet.
	const enableContrastChecking = Platform.OS === 'web';
	useEffect( () => {
		if ( ! enableContrastChecking ) {
			return;
		}
		detectColors(
			navRef.current,
			setDetectedColor,
			setDetectedBackgroundColor
		);

		const subMenuElement = navRef.current?.querySelector(
			'[data-type="core/navigation-submenu"] [data-type="core/navigation-link"]'
		);

		if ( ! subMenuElement ) {
			return;
		}

		// Only detect submenu overlay colors if they have previously been explicitly set.
		// This avoids the contrast checker from reporting on inherited submenu colors and
		// showing the contrast warning twice.
		if ( overlayTextColor.color || overlayBackgroundColor.color ) {
			detectColors(
				subMenuElement,
				setDetectedOverlayColor,
				setDetectedOverlayBackgroundColor
			);
		}
	}, [
		enableContrastChecking,
		overlayTextColor.color,
		overlayBackgroundColor.color,
		navRef,
	] );
	const colorGradientSettings = useMultipleOriginColorsAndGradients();
	if ( ! colorGradientSettings.hasColorsOrGradients ) {
		return null;
	}
	return (
		<>
			<ColorGradientSettingsDropdown
				__experimentalIsRenderedInSidebar
				settings={ [
					{
						colorValue: textColor.color,
						label: __( 'Text' ),
						onColorChange: setTextColor,
						resetAllFilter: () => setTextColor(),
					},
					{
						colorValue: backgroundColor.color,
						label: __( 'Background' ),
						onColorChange: setBackgroundColor,
						resetAllFilter: () => setBackgroundColor(),
					},
					{
						colorValue: overlayTextColor.color,
						label: __( 'Submenu & overlay text' ),
						onColorChange: setOverlayTextColor,
						resetAllFilter: () => setOverlayTextColor(),
					},
					{
						colorValue: overlayBackgroundColor.color,
						label: __( 'Submenu & overlay background' ),
						onColorChange: setOverlayBackgroundColor,
						resetAllFilter: () => setOverlayBackgroundColor(),
					},
				] }
				panelId={ clientId }
				{ ...colorGradientSettings }
				gradients={ [] }
				disableCustomGradients
			/>
			{ enableContrastChecking && (
				<>
					<ContrastChecker
						backgroundColor={ detectedBackgroundColor }
						textColor={ detectedColor }
					/>
					<ContrastChecker
						backgroundColor={ detectedOverlayBackgroundColor }
						textColor={ detectedOverlayColor }
					/>
				</>
			) }
		</>
	);
}

function Navigation( {
	attributes,
	setAttributes,
	clientId,
	isSelected,
	className,
	backgroundColor,
	setBackgroundColor,
	textColor,
	setTextColor,
	overlayBackgroundColor,
	setOverlayBackgroundColor,
	overlayTextColor,
	setOverlayTextColor,

	// These props are used by the navigation editor to override specific
	// navigation block settings.
	hasSubmenuIndicatorSetting = true,
	customPlaceholder: CustomPlaceholder = null,
	__unstableLayoutClassNames: layoutClassNames,
} ) {
	const {
		openSubmenusOnClick,
		overlayMenu,
		showSubmenuIcon,
		templateLock,
		layout: {
			justifyContent,
			orientation = 'horizontal',
			flexWrap = 'wrap',
		} = {},
		hasIcon,
		icon = 'handle',
	} = attributes;

	const ref = attributes.ref;

	const setRef = useCallback(
		( postId ) => {
			setAttributes( { ref: postId } );
		},
		[ setAttributes ]
	);

	const recursionId = `navigationMenu/${ ref }`;
	const hasAlreadyRendered = useHasRecursion( recursionId );

	const blockEditingMode = useBlockEditingMode();

	// Preload classic menus, so that they don't suddenly pop-in when viewing
	// the Select Menu dropdown.
	const { menus: classicMenus } = useNavigationEntities();

	const [ showNavigationMenuStatusNotice, hideNavigationMenuStatusNotice ] =
		useNavigationNotice( {
			name: 'block-library/core/navigation/status',
		} );

	const [ showClassicMenuConversionNotice, hideClassicMenuConversionNotice ] =
		useNavigationNotice( {
			name: 'block-library/core/navigation/classic-menu-conversion',
		} );

	const [
		showNavigationMenuPermissionsNotice,
		hideNavigationMenuPermissionsNotice,
	] = useNavigationNotice( {
		name: 'block-library/core/navigation/permissions/update',
	} );

	const {
		create: createNavigationMenu,
		status: createNavigationMenuStatus,
		error: createNavigationMenuError,
		value: createNavigationMenuPost,
		isPending: isCreatingNavigationMenu,
		isSuccess: createNavigationMenuIsSuccess,
		isError: createNavigationMenuIsError,
	} = useCreateNavigationMenu( clientId );

	const createUntitledEmptyNavigationMenu = async () => {
		await createNavigationMenu( '' );
	};

	const {
		hasUncontrolledInnerBlocks,
		uncontrolledInnerBlocks,
		isInnerBlockSelected,
		innerBlocks,
	} = useInnerBlocks( clientId );

	const hasSubmenus = !! innerBlocks.find(
		( block ) => block.name === 'core/navigation-submenu'
	);

	const {
		replaceInnerBlocks,
		selectBlock,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	const [ isResponsiveMenuOpen, setResponsiveMenuVisibility ] =
		useState( false );

	const [ overlayMenuPreview, setOverlayMenuPreview ] = useState( false );

	const {
		hasResolvedNavigationMenus,
		isNavigationMenuResolved,
		isNavigationMenuMissing,
		canUserUpdateNavigationMenu,
		hasResolvedCanUserUpdateNavigationMenu,
		canUserDeleteNavigationMenu,
		hasResolvedCanUserDeleteNavigationMenu,
		canUserCreateNavigationMenus,
		isResolvingCanUserCreateNavigationMenus,
		hasResolvedCanUserCreateNavigationMenus,
	} = useNavigationMenu( ref );

	const navMenuResolvedButMissing =
		hasResolvedNavigationMenus && isNavigationMenuMissing;

	const {
		convert: convertClassicMenu,
		status: classicMenuConversionStatus,
		error: classicMenuConversionError,
	} = useConvertClassicToBlockMenu( createNavigationMenu );

	const isConvertingClassicMenu =
		classicMenuConversionStatus === CLASSIC_MENU_CONVERSION_PENDING;

	const handleUpdateMenu = useCallback(
		( menuId, options = { focusNavigationBlock: false } ) => {
			const { focusNavigationBlock } = options;
			setRef( menuId );
			if ( focusNavigationBlock ) {
				selectBlock( clientId );
			}
		},
		[ selectBlock, clientId, setRef ]
	);

	const isEntityAvailable =
		! isNavigationMenuMissing && isNavigationMenuResolved;

	// If the block has inner blocks, but no menu id, then these blocks are either:
	// - inserted via a pattern.
	// - inserted directly via Code View (or otherwise).
	// - from an older version of navigation block added before the block used a wp_navigation entity.
	// Consider this state as 'unsaved' and offer an uncontrolled version of inner blocks,
	// that automatically saves the menu as an entity when changes are made to the inner blocks.
	const hasUnsavedBlocks = hasUncontrolledInnerBlocks && ! isEntityAvailable;

	const { getNavigationFallbackId } = unlock( useSelect( coreStore ) );

	const navigationFallbackId = ! ( ref || hasUnsavedBlocks )
		? getNavigationFallbackId()
		: null;

	useEffect( () => {
		// If:
		// - there is an existing menu, OR
		// - there are existing (uncontrolled) inner blocks
		// ...then don't request a fallback menu.
		if ( ref || hasUnsavedBlocks || ! navigationFallbackId ) {
			return;
		}

		/**
		 *  This fallback displays (both in editor and on front)
		 *  The fallback should not request a save (entity dirty state)
		 *  nor to be undoable, hence why it is marked as non persistent
		 */

		__unstableMarkNextChangeAsNotPersistent();
		setRef( navigationFallbackId );
	}, [
		ref,
		setRef,
		hasUnsavedBlocks,
		navigationFallbackId,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	const navRef = useRef();

	// The standard HTML5 tag for the block wrapper.
	const TagName = 'nav';

	// "placeholder" shown if:
	// - there is no ref attribute pointing to a Navigation Post.
	// - there is no classic menu conversion process in progress.
	// - there is no menu creation process in progress.
	// - there are no uncontrolled blocks.
	const isPlaceholder =
		! ref &&
		! isCreatingNavigationMenu &&
		! isConvertingClassicMenu &&
		hasResolvedNavigationMenus &&
		classicMenus?.length === 0 &&
		! hasUncontrolledInnerBlocks;

	// "loading" state:
	// - there is a menu creation process in progress.
	// - there is a classic menu conversion process in progress.
	// OR:
	// - there is a ref attribute pointing to a Navigation Post
	// - the Navigation Post isn't available (hasn't resolved) yet.
	const isLoading =
		! hasResolvedNavigationMenus ||
		isCreatingNavigationMenu ||
		isConvertingClassicMenu ||
		!! ( ref && ! isEntityAvailable && ! isConvertingClassicMenu );

	const textDecoration = attributes.style?.typography?.textDecoration;

	const hasBlockOverlay = useSelect(
		( select ) =>
			select( blockEditorStore ).__unstableHasActiveBlockOverlayActive(
				clientId
			),
		[ clientId ]
	);
	const isResponsive = 'never' !== overlayMenu;
	const blockProps = useBlockProps( {
		ref: navRef,
		className: clsx(
			className,
			{
				'items-justified-right': justifyContent === 'right',
				'items-justified-space-between':
					justifyContent === 'space-between',
				'items-justified-left': justifyContent === 'left',
				'items-justified-center': justifyContent === 'center',
				'is-vertical': orientation === 'vertical',
				'no-wrap': flexWrap === 'nowrap',
				'is-responsive': isResponsive,
				'has-text-color': !! textColor.color || !! textColor?.class,
				[ getColorClassName( 'color', textColor?.slug ) ]:
					!! textColor?.slug,
				'has-background':
					!! backgroundColor.color || backgroundColor.class,
				[ getColorClassName(
					'background-color',
					backgroundColor?.slug
				) ]: !! backgroundColor?.slug,
				[ `has-text-decoration-${ textDecoration }` ]: textDecoration,
				'block-editor-block-content-overlay': hasBlockOverlay,
			},
			layoutClassNames
		),
		style: {
			color: ! textColor?.slug && textColor?.color,
			backgroundColor: ! backgroundColor?.slug && backgroundColor?.color,
		},
	} );

	const onSelectClassicMenu = async ( classicMenu ) => {
		return convertClassicMenu( classicMenu.id, classicMenu.name, 'draft' );
	};

	const onSelectNavigationMenu = ( menuId ) => {
		handleUpdateMenu( menuId );
	};

	useEffect( () => {
		hideNavigationMenuStatusNotice();

		if ( isCreatingNavigationMenu ) {
			speak( __( `Creating Navigation Menu.` ) );
		}

		if ( createNavigationMenuIsSuccess ) {
			handleUpdateMenu( createNavigationMenuPost?.id, {
				focusNavigationBlock: true,
			} );

			showNavigationMenuStatusNotice(
				__( `Navigation Menu successfully created.` )
			);
		}

		if ( createNavigationMenuIsError ) {
			showNavigationMenuStatusNotice(
				__( 'Failed to create Navigation Menu.' )
			);
		}
	}, [
		createNavigationMenuStatus,
		createNavigationMenuError,
		createNavigationMenuPost?.id,
		createNavigationMenuIsError,
		createNavigationMenuIsSuccess,
		isCreatingNavigationMenu,
		handleUpdateMenu,
		hideNavigationMenuStatusNotice,
		showNavigationMenuStatusNotice,
	] );

	useEffect( () => {
		hideClassicMenuConversionNotice();
		if ( classicMenuConversionStatus === CLASSIC_MENU_CONVERSION_PENDING ) {
			speak( __( 'Classic menu importing.' ) );
		}

		if ( classicMenuConversionStatus === CLASSIC_MENU_CONVERSION_SUCCESS ) {
			showClassicMenuConversionNotice(
				__( 'Classic menu imported successfully.' )
			);
			handleUpdateMenu( createNavigationMenuPost?.id, {
				focusNavigationBlock: true,
			} );
		}

		if ( classicMenuConversionStatus === CLASSIC_MENU_CONVERSION_ERROR ) {
			showClassicMenuConversionNotice(
				__( 'Classic menu import failed.' )
			);
		}
	}, [
		classicMenuConversionStatus,
		classicMenuConversionError,
		hideClassicMenuConversionNotice,
		showClassicMenuConversionNotice,
		createNavigationMenuPost?.id,
		handleUpdateMenu,
	] );

	useEffect( () => {
		if ( ! isSelected && ! isInnerBlockSelected ) {
			hideNavigationMenuPermissionsNotice();
		}

		if ( isSelected || isInnerBlockSelected ) {
			if (
				ref &&
				! navMenuResolvedButMissing &&
				hasResolvedCanUserUpdateNavigationMenu &&
				! canUserUpdateNavigationMenu
			) {
				showNavigationMenuPermissionsNotice(
					__(
						'You do not have permission to edit this Menu. Any changes made will not be saved.'
					)
				);
			}

			if (
				! ref &&
				hasResolvedCanUserCreateNavigationMenus &&
				! canUserCreateNavigationMenus
			) {
				showNavigationMenuPermissionsNotice(
					__(
						'You do not have permission to create Navigation Menus.'
					)
				);
			}
		}
	}, [
		isSelected,
		isInnerBlockSelected,
		canUserUpdateNavigationMenu,
		hasResolvedCanUserUpdateNavigationMenu,
		canUserCreateNavigationMenus,
		hasResolvedCanUserCreateNavigationMenus,
		ref,
		hideNavigationMenuPermissionsNotice,
		showNavigationMenuPermissionsNotice,
		navMenuResolvedButMissing,
	] );

	const hasManagePermissions =
		canUserCreateNavigationMenus || canUserUpdateNavigationMenu;

	const overlayMenuPreviewClasses = clsx(
		'wp-block-navigation__overlay-menu-preview',
		{ open: overlayMenuPreview }
	);

	const submenuAccessibilityNotice =
		! showSubmenuIcon && ! openSubmenusOnClick
			? __(
					'The current menu options offer reduced accessibility for users and are not recommended. Enabling either "Open on Click" or "Show arrow" offers enhanced accessibility by allowing keyboard users to browse submenus selectively.'
			  )
			: '';

	const isFirstRender = useRef( true ); // Don't speak on first render.
	useEffect( () => {
		if ( ! isFirstRender.current && submenuAccessibilityNotice ) {
			speak( submenuAccessibilityNotice );
		}
		isFirstRender.current = false;
	}, [ submenuAccessibilityNotice ] );

	const overlayMenuPreviewId = useInstanceId(
		OverlayMenuPreview,
		`overlay-menu-preview`
	);

	const stylingInspectorControls = (
		<>
			<InspectorControls>
				{ hasSubmenuIndicatorSetting && (
					<PanelBody title={ __( 'Display' ) }>
						{ isResponsive && (
							<>
								<Button
									className={ overlayMenuPreviewClasses }
									onClick={ () => {
										setOverlayMenuPreview(
											! overlayMenuPreview
										);
									} }
									aria-label={ __( 'Overlay menu controls' ) }
									aria-controls={ overlayMenuPreviewId }
									aria-expanded={ overlayMenuPreview }
								>
									{ hasIcon && (
										<>
											<OverlayMenuIcon icon={ icon } />
											<Icon icon={ close } />
										</>
									) }
									{ ! hasIcon && (
										<>
											<span>{ __( 'Menu' ) }</span>
											<span>{ __( 'Close' ) }</span>
										</>
									) }
								</Button>
								<div id={ overlayMenuPreviewId }>
									{ overlayMenuPreview && (
										<OverlayMenuPreview
											setAttributes={ setAttributes }
											hasIcon={ hasIcon }
											icon={ icon }
											hidden={ ! overlayMenuPreview }
										/>
									) }
								</div>
							</>
						) }
						<ToggleGroupControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Overlay Menu' ) }
							aria-label={ __( 'Configure overlay menu' ) }
							value={ overlayMenu }
							help={ __(
								'Collapses the navigation options in a menu icon opening an overlay.'
							) }
							onChange={ ( value ) =>
								setAttributes( { overlayMenu: value } )
							}
							isBlock
						>
							<ToggleGroupControlOption
								value="never"
								label={ __( 'Off' ) }
							/>
							<ToggleGroupControlOption
								value="mobile"
								label={ __( 'Mobile' ) }
							/>
							<ToggleGroupControlOption
								value="always"
								label={ __( 'Always' ) }
							/>
						</ToggleGroupControl>
						{ hasSubmenus && (
							<>
								<h3>{ __( 'Submenus' ) }</h3>
								<ToggleControl
									__nextHasNoMarginBottom
									checked={ openSubmenusOnClick }
									onChange={ ( value ) => {
										setAttributes( {
											openSubmenusOnClick: value,
											...( value && {
												showSubmenuIcon: true,
											} ), // Make sure arrows are shown when we toggle this on.
										} );
									} }
									label={ __( 'Open on click' ) }
								/>

								<ToggleControl
									__nextHasNoMarginBottom
									checked={ showSubmenuIcon }
									onChange={ ( value ) => {
										setAttributes( {
											showSubmenuIcon: value,
										} );
									} }
									disabled={ attributes.openSubmenusOnClick }
									label={ __( 'Show arrow' ) }
								/>

								{ submenuAccessibilityNotice && (
									<div>
										<Notice
											spokenMessage={ null }
											status="warning"
											isDismissible={ false }
										>
											{ submenuAccessibilityNotice }
										</Notice>
									</div>
								) }
							</>
						) }
					</PanelBody>
				) }
			</InspectorControls>
			<InspectorControls group="color">
				{ /*
				 * Avoid useMultipleOriginColorsAndGradients and detectColors
				 * on block mount. InspectorControls only mounts this component
				 * when the block is selected.
				 * */ }
				<ColorTools
					textColor={ textColor }
					setTextColor={ setTextColor }
					backgroundColor={ backgroundColor }
					setBackgroundColor={ setBackgroundColor }
					overlayTextColor={ overlayTextColor }
					setOverlayTextColor={ setOverlayTextColor }
					overlayBackgroundColor={ overlayBackgroundColor }
					setOverlayBackgroundColor={ setOverlayBackgroundColor }
					clientId={ clientId }
					navRef={ navRef }
				/>
			</InspectorControls>
		</>
	);

	const accessibleDescriptionId = `${ clientId }-desc`;
	const isHiddenByDefault = 'always' === overlayMenu;
	const isManageMenusButtonDisabled =
		! hasManagePermissions || ! hasResolvedNavigationMenus;

	if ( hasUnsavedBlocks && ! isCreatingNavigationMenu ) {
		return (
			<TagName
				{ ...blockProps }
				aria-describedby={
					! isPlaceholder ? accessibleDescriptionId : undefined
				}
			>
				<AccessibleDescription id={ accessibleDescriptionId }>
					{ __( 'Unsaved Navigation Menu.' ) }
				</AccessibleDescription>

				<MenuInspectorControls
					clientId={ clientId }
					createNavigationMenuIsSuccess={
						createNavigationMenuIsSuccess
					}
					createNavigationMenuIsError={ createNavigationMenuIsError }
					currentMenuId={ ref }
					isNavigationMenuMissing={ isNavigationMenuMissing }
					isManageMenusButtonDisabled={ isManageMenusButtonDisabled }
					onCreateNew={ createUntitledEmptyNavigationMenu }
					onSelectClassicMenu={ onSelectClassicMenu }
					onSelectNavigationMenu={ onSelectNavigationMenu }
					isLoading={ isLoading }
					blockEditingMode={ blockEditingMode }
				/>
				{ blockEditingMode === 'default' && stylingInspectorControls }
				<ResponsiveWrapper
					id={ clientId }
					onToggle={ setResponsiveMenuVisibility }
					isOpen={ isResponsiveMenuOpen }
					hasIcon={ hasIcon }
					icon={ icon }
					isResponsive={ isResponsive }
					isHiddenByDefault={ isHiddenByDefault }
					overlayBackgroundColor={ overlayBackgroundColor }
					overlayTextColor={ overlayTextColor }
				>
					<UnsavedInnerBlocks
						createNavigationMenu={ createNavigationMenu }
						blocks={ uncontrolledInnerBlocks }
						hasSelection={ isSelected || isInnerBlockSelected }
					/>
				</ResponsiveWrapper>
			</TagName>
		);
	}

	// Show a warning if the selected menu is no longer available.
	// TODO - the user should be able to select a new one?
	if ( ref && isNavigationMenuMissing ) {
		return (
			<TagName { ...blockProps }>
				<MenuInspectorControls
					clientId={ clientId }
					createNavigationMenuIsSuccess={
						createNavigationMenuIsSuccess
					}
					createNavigationMenuIsError={ createNavigationMenuIsError }
					currentMenuId={ ref }
					isNavigationMenuMissing={ isNavigationMenuMissing }
					isManageMenusButtonDisabled={ isManageMenusButtonDisabled }
					onCreateNew={ createUntitledEmptyNavigationMenu }
					onSelectClassicMenu={ onSelectClassicMenu }
					onSelectNavigationMenu={ onSelectNavigationMenu }
					isLoading={ isLoading }
					blockEditingMode={ blockEditingMode }
				/>
				<DeletedNavigationWarning
					onCreateNew={ createUntitledEmptyNavigationMenu }
				/>
			</TagName>
		);
	}

	if ( isEntityAvailable && hasAlreadyRendered ) {
		return (
			<div { ...blockProps }>
				<Warning>
					{ __( 'Block cannot be rendered inside itself.' ) }
				</Warning>
			</div>
		);
	}

	const PlaceholderComponent = CustomPlaceholder
		? CustomPlaceholder
		: Placeholder;

	/**
	 * Historically the navigation block has supported custom placeholders.
	 * Even though the current UX tries as hard as possible not to
	 * end up in a placeholder state, the block continues to support
	 * this extensibility point, via a CustomPlaceholder.
	 * When CustomPlaceholder is present it becomes the default fallback
	 * for an empty navigation block, instead of the default fallbacks.
	 *
	 */

	if ( isPlaceholder && CustomPlaceholder ) {
		return (
			<TagName { ...blockProps }>
				<PlaceholderComponent
					isSelected={ isSelected }
					currentMenuId={ ref }
					clientId={ clientId }
					canUserCreateNavigationMenus={
						canUserCreateNavigationMenus
					}
					isResolvingCanUserCreateNavigationMenus={
						isResolvingCanUserCreateNavigationMenus
					}
					onSelectNavigationMenu={ onSelectNavigationMenu }
					onSelectClassicMenu={ onSelectClassicMenu }
					onCreateEmpty={ createUntitledEmptyNavigationMenu }
				/>
			</TagName>
		);
	}

	return (
		<EntityProvider kind="postType" type="wp_navigation" id={ ref }>
			<RecursionProvider uniqueId={ recursionId }>
				<MenuInspectorControls
					clientId={ clientId }
					createNavigationMenuIsSuccess={
						createNavigationMenuIsSuccess
					}
					createNavigationMenuIsError={ createNavigationMenuIsError }
					currentMenuId={ ref }
					isNavigationMenuMissing={ isNavigationMenuMissing }
					isManageMenusButtonDisabled={ isManageMenusButtonDisabled }
					onCreateNew={ createUntitledEmptyNavigationMenu }
					onSelectClassicMenu={ onSelectClassicMenu }
					onSelectNavigationMenu={ onSelectNavigationMenu }
					isLoading={ isLoading }
					blockEditingMode={ blockEditingMode }
				/>
				{ blockEditingMode === 'default' && stylingInspectorControls }
				{ blockEditingMode === 'default' && isEntityAvailable && (
					<InspectorControls group="advanced">
						{ hasResolvedCanUserUpdateNavigationMenu &&
							canUserUpdateNavigationMenu && (
								<NavigationMenuNameControl />
							) }
						{ hasResolvedCanUserDeleteNavigationMenu &&
							canUserDeleteNavigationMenu && (
								<NavigationMenuDeleteControl
									onDelete={ () => {
										replaceInnerBlocks( clientId, [] );
										showNavigationMenuStatusNotice(
											__(
												'Navigation Menu successfully deleted.'
											)
										);
									} }
								/>
							) }
						<ManageMenusButton
							disabled={ isManageMenusButtonDisabled }
							className="wp-block-navigation-manage-menus-button"
						/>
					</InspectorControls>
				) }

				<TagName
					{ ...blockProps }
					aria-describedby={
						! isPlaceholder && ! isLoading
							? accessibleDescriptionId
							: undefined
					}
				>
					{ isLoading && ! isHiddenByDefault && (
						<div className="wp-block-navigation__loading-indicator-container">
							<Spinner className="wp-block-navigation__loading-indicator" />
						</div>
					) }

					{ ( ! isLoading || isHiddenByDefault ) && (
						<>
							<AccessibleMenuDescription
								id={ accessibleDescriptionId }
							/>
							<ResponsiveWrapper
								id={ clientId }
								onToggle={ setResponsiveMenuVisibility }
								hasIcon={ hasIcon }
								icon={ icon }
								isOpen={ isResponsiveMenuOpen }
								isResponsive={ isResponsive }
								isHiddenByDefault={ isHiddenByDefault }
								overlayBackgroundColor={
									overlayBackgroundColor
								}
								overlayTextColor={ overlayTextColor }
							>
								{ isEntityAvailable && (
									<NavigationInnerBlocks
										clientId={ clientId }
										hasCustomPlaceholder={
											!! CustomPlaceholder
										}
										templateLock={ templateLock }
										orientation={ orientation }
									/>
								) }
							</ResponsiveWrapper>
						</>
					) }
				</TagName>
			</RecursionProvider>
		</EntityProvider>
	);
}

export default withColors(
	{ textColor: 'color' },
	{ backgroundColor: 'color' },
	{ overlayBackgroundColor: 'color' },
	{ overlayTextColor: 'color' }
)( Navigation );
