/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useState,
	useEffect,
	useRef,
	Platform,
	useMemo,
} from '@wordpress/element';
import {
	InspectorControls,
	useBlockProps,
	__experimentalRecursionProvider as RecursionProvider,
	__experimentalUseHasRecursion as useHasRecursion,
	store as blockEditorStore,
	withColors,
	ContrastChecker,
	getColorClassName,
	Warning,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseBlockOverlayActive as useBlockOverlayActive,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
} from '@wordpress/block-editor';
import { EntityProvider } from '@wordpress/core-data';

import { useDispatch } from '@wordpress/data';
import {
	PanelBody,
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	Button,
	Spinner,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { createBlock } from '@wordpress/blocks';
import { close, Icon } from '@wordpress/icons';

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
	hasColorSettings = true,
	customPlaceholder: CustomPlaceholder = null,
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

	const setRef = ( postId ) => {
		setAttributes( { ref: postId } );
	};

	const recursionId = `navigationMenu/${ ref }`;
	const hasAlreadyRendered = useHasRecursion( recursionId );

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

	const createUntitledEmptyNavigationMenu = () => {
		createNavigationMenu( '' );
	};

	useEffect( () => {
		hideNavigationMenuStatusNotice();

		if ( isCreatingNavigationMenu ) {
			speak( __( `Creating Navigation Menu.` ) );
		}

		if ( createNavigationMenuIsSuccess ) {
			handleUpdateMenu( createNavigationMenuPost.id, {
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
		createNavigationMenuPost,
	] );

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
		navigationMenus,
		canUserUpdateNavigationMenu,
		hasResolvedCanUserUpdateNavigationMenu,
		canUserDeleteNavigationMenu,
		hasResolvedCanUserDeleteNavigationMenu,
		canUserCreateNavigationMenu,
		isResolvingCanUserCreateNavigationMenu,
		hasResolvedCanUserCreateNavigationMenu,
	} = useNavigationMenu( ref );

	const navMenuResolvedButMissing =
		hasResolvedNavigationMenus && isNavigationMenuMissing;

	const {
		convert: convertClassicMenu,
		status: classicMenuConversionStatus,
		error: classicMenuConversionError,
	} = useConvertClassicToBlockMenu( clientId );

	const isConvertingClassicMenu =
		classicMenuConversionStatus === CLASSIC_MENU_CONVERSION_PENDING;

	// Only autofallback to published menus.
	const fallbackNavigationMenus = useMemo(
		() =>
			navigationMenus
				?.filter( ( menu ) => menu.status === 'publish' )
				?.sort( ( menuA, menuB ) => {
					const menuADate = new Date( menuA.date );
					const menuBDate = new Date( menuB.date );
					return menuADate.getTime() < menuBDate.getTime();
				} ),
		[ navigationMenus ]
	);

	// Attempt to retrieve and prioritize any existing navigation menu unless:
	// - the are uncontrolled inner blocks already present in the block.
	// - the user is creating a new menu.
	// - there are no menus to choose from.
	// This attempts to pick the first menu if there is a single Navigation Post. If more
	// than 1 exists then use the most recent.
	// The aim is for the block to "just work" from a user perspective using existing data.
	useEffect( () => {
		if (
			hasUncontrolledInnerBlocks ||
			isCreatingNavigationMenu ||
			ref ||
			! fallbackNavigationMenus?.length
		) {
			return;
		}

		/**
		 *  This fallback displays (both in editor and on front)
		 *  a list of pages only if no menu (user assigned or
		 *  automatically picked) is available.
		 *  The fallback should not request a save (entity dirty state)
		 *  nor to be undoable, hence why it is marked as non persistent
		 */
		__unstableMarkNextChangeAsNotPersistent();
		setRef( fallbackNavigationMenus[ 0 ].id );
	}, [
		ref,
		isCreatingNavigationMenu,
		fallbackNavigationMenus,
		hasUncontrolledInnerBlocks,
	] );

	useEffect( () => {
		if (
			! hasResolvedNavigationMenus ||
			isConvertingClassicMenu ||
			fallbackNavigationMenus?.length > 0 ||
			! classicMenus?.length
		) {
			return;
		}

		// If there's non fallback navigation menus and
		// a classic menu with a `primary` location or slug,
		// then create a new navigation menu based on it.
		// Otherwise, use the most recently created classic menu.
		const primaryMenus = classicMenus.filter(
			( classicMenu ) =>
				classicMenu.locations.includes( 'primary' ) ||
				classicMenu.slug === 'primary'
		);

		if ( primaryMenus.length ) {
			convertClassicMenu(
				primaryMenus[ 0 ].id,
				primaryMenus[ 0 ].name,
				'publish'
			);
		} else {
			classicMenus.sort( ( a, b ) => {
				return b.id - a.id;
			} );
			convertClassicMenu(
				classicMenus[ 0 ].id,
				classicMenus[ 0 ].name,
				'publish'
			);
		}
	}, [ hasResolvedNavigationMenus ] );

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

	useEffect( () => {
		if ( isPlaceholder ) {
			/**
			 *  this fallback only displays (both in editor and on front)
			 *  the list of pages block if no menu is available as a fallback.
			 *  We don't want the fallback to request a save,
			 *  nor to be undoable, hence we mark it non persistent.
			 */
			__unstableMarkNextChangeAsNotPersistent();
			replaceInnerBlocks( clientId, [ createBlock( 'core/page-list' ) ] );
		}
	}, [ clientId, isPlaceholder, ref ] );

	const isEntityAvailable =
		! isNavigationMenuMissing && isNavigationMenuResolved;

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

	const hasBlockOverlay = useBlockOverlayActive( clientId );
	const blockProps = useBlockProps( {
		ref: navRef,
		className: classnames( className, {
			'items-justified-right': justifyContent === 'right',
			'items-justified-space-between': justifyContent === 'space-between',
			'items-justified-left': justifyContent === 'left',
			'items-justified-center': justifyContent === 'center',
			'is-vertical': orientation === 'vertical',
			'no-wrap': flexWrap === 'nowrap',
			'is-responsive': 'never' !== overlayMenu,
			'has-text-color': !! textColor.color || !! textColor?.class,
			[ getColorClassName( 'color', textColor?.slug ) ]:
				!! textColor?.slug,
			'has-background': !! backgroundColor.color || backgroundColor.class,
			[ getColorClassName( 'background-color', backgroundColor?.slug ) ]:
				!! backgroundColor?.slug,
			[ `has-text-decoration-${ textDecoration }` ]: textDecoration,
			'block-editor-block-content-overlay': hasBlockOverlay,
		} ),
		style: {
			color: ! textColor?.slug && textColor?.color,
			backgroundColor: ! backgroundColor?.slug && backgroundColor?.color,
		},
	} );

	// Turn on contrast checker for web only since it's not supported on mobile yet.
	const enableContrastChecking = Platform.OS === 'web';

	const [ detectedBackgroundColor, setDetectedBackgroundColor ] = useState();
	const [ detectedColor, setDetectedColor ] = useState();
	const [
		detectedOverlayBackgroundColor,
		setDetectedOverlayBackgroundColor,
	] = useState();
	const [ detectedOverlayColor, setDetectedOverlayColor ] = useState();

	const handleUpdateMenu = (
		menuId,
		options = { focusNavigationBlock: false }
	) => {
		const { focusNavigationBlock } = options;
		setRef( menuId );
		if ( focusNavigationBlock ) {
			selectBlock( clientId );
		}
	};

	const onSelectClassicMenu = async ( classicMenu ) => {
		const navMenu = await convertClassicMenu(
			classicMenu.id,
			classicMenu.name,
			'draft'
		);
		if ( navMenu ) {
			handleUpdateMenu( navMenu.id, {
				focusNavigationBlock: true,
			} );
		}
	};

	const onSelectNavigationMenu = ( menuId ) => {
		handleUpdateMenu( menuId );
	};

	useEffect( () => {
		hideClassicMenuConversionNotice();
		if ( classicMenuConversionStatus === CLASSIC_MENU_CONVERSION_PENDING ) {
			speak( __( 'Classic menu importing.' ) );
		}

		if ( classicMenuConversionStatus === CLASSIC_MENU_CONVERSION_SUCCESS ) {
			showClassicMenuConversionNotice(
				__( 'Classic menu imported successfully.' )
			);
		}

		if ( classicMenuConversionStatus === CLASSIC_MENU_CONVERSION_ERROR ) {
			showClassicMenuConversionNotice(
				__( 'Classic menu import failed.' )
			);
		}
	}, [ classicMenuConversionStatus, classicMenuConversionError ] );

	// Spacer block needs orientation from context. This is a patch until
	// https://github.com/WordPress/gutenberg/issues/36197 is addressed.
	useEffect( () => {
		if ( orientation ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { orientation } );
		}
	}, [ orientation ] );

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
	} );

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
				hasResolvedCanUserCreateNavigationMenu &&
				! canUserCreateNavigationMenu
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
		canUserCreateNavigationMenu,
		hasResolvedCanUserCreateNavigationMenu,
		ref,
	] );

	const hasManagePermissions =
		canUserCreateNavigationMenu || canUserUpdateNavigationMenu;
	const isResponsive = 'never' !== overlayMenu;

	const overlayMenuPreviewClasses = classnames(
		'wp-block-navigation__overlay-menu-preview',
		{ open: overlayMenuPreview }
	);

	const colorGradientSettings = useMultipleOriginColorsAndGradients();
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
								{ overlayMenuPreview && (
									<OverlayMenuPreview
										setAttributes={ setAttributes }
										hasIcon={ hasIcon }
										icon={ icon }
									/>
								) }
							</>
						) }
						<h3>{ __( 'Overlay Menu' ) }</h3>
						<ToggleGroupControl
							__nextHasNoMarginBottom
							label={ __( 'Configure overlay menu' ) }
							value={ overlayMenu }
							help={ __(
								'Collapses the navigation options in a menu icon opening an overlay.'
							) }
							onChange={ ( value ) =>
								setAttributes( { overlayMenu: value } )
							}
							isBlock
							hideLabelFromVision
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
									checked={ showSubmenuIcon }
									onChange={ ( value ) => {
										setAttributes( {
											showSubmenuIcon: value,
										} );
									} }
									disabled={ attributes.openSubmenusOnClick }
									label={ __( 'Show arrow' ) }
								/>
							</>
						) }
					</PanelBody>
				) }
			</InspectorControls>
			<InspectorControls group="color">
				{ hasColorSettings && (
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
									resetAllFilter: () =>
										setOverlayBackgroundColor(),
								},
							] }
							panelId={ clientId }
							{ ...colorGradientSettings }
							gradients={ [] }
							disableCustomGradients={ true }
						/>
						{ enableContrastChecking && (
							<>
								<ContrastChecker
									backgroundColor={ detectedBackgroundColor }
									textColor={ detectedColor }
								/>
								<ContrastChecker
									backgroundColor={
										detectedOverlayBackgroundColor
									}
									textColor={ detectedOverlayColor }
								/>
							</>
						) }
					</>
				) }
			</InspectorControls>
		</>
	);

	// If the block has inner blocks, but no menu id, then these blocks are either:
	// - inserted via a pattern.
	// - inserted directly via Code View (or otherwise).
	// - from an older version of navigation block added before the block used a wp_navigation entity.
	// Consider this state as 'unsaved' and offer an uncontrolled version of inner blocks,
	// that automatically saves the menu as an entity when changes are made to the inner blocks.
	const hasUnsavedBlocks = hasUncontrolledInnerBlocks && ! isEntityAvailable;

	const isManageMenusButtonDisabled =
		! hasManagePermissions || ! hasResolvedNavigationMenus;

	if ( hasUnsavedBlocks && ! isCreatingNavigationMenu ) {
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
				/>
				{ stylingInspectorControls }
				<ResponsiveWrapper
					id={ clientId }
					onToggle={ setResponsiveMenuVisibility }
					isOpen={ isResponsiveMenuOpen }
					hasIcon={ hasIcon }
					icon={ icon }
					isResponsive={ 'never' !== overlayMenu }
					isHiddenByDefault={ 'always' === overlayMenu }
					overlayBackgroundColor={ overlayBackgroundColor }
					overlayTextColor={ overlayTextColor }
				>
					<UnsavedInnerBlocks
						createNavigationMenu={ createNavigationMenu }
						blocks={ uncontrolledInnerBlocks }
						templateLock={ templateLock }
						navigationMenus={ navigationMenus }
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
					isNavigationMenuMissing={ isNavigationMenuMissing }
					isManageMenusButtonDisabled={ isManageMenusButtonDisabled }
					onCreateNew={ createUntitledEmptyNavigationMenu }
					onSelectClassicMenu={ onSelectClassicMenu }
					onSelectNavigationMenu={ onSelectNavigationMenu }
					isLoading={ isLoading }
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
					canUserCreateNavigationMenu={ canUserCreateNavigationMenu }
					isResolvingCanUserCreateNavigationMenu={
						isResolvingCanUserCreateNavigationMenu
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
				/>
				{ stylingInspectorControls }
				{ isEntityAvailable && (
					<InspectorControls group="advanced">
						{ hasResolvedCanUserUpdateNavigationMenu &&
							canUserUpdateNavigationMenu && (
								<NavigationMenuNameControl />
							) }
						{ hasResolvedCanUserDeleteNavigationMenu &&
							canUserDeleteNavigationMenu && (
								<NavigationMenuDeleteControl
									onDelete={ ( deletedMenuTitle = '' ) => {
										replaceInnerBlocks( clientId, [] );
										showNavigationMenuStatusNotice(
											sprintf(
												// translators: %s: the name of a menu (e.g. Header navigation).
												__(
													'Navigation menu %s successfully deleted.'
												),
												deletedMenuTitle
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

				{ isLoading && (
					<TagName { ...blockProps }>
						<Spinner className="wp-block-navigation__loading-indicator" />
					</TagName>
				) }

				{ ! isLoading && (
					<TagName { ...blockProps }>
						<ResponsiveWrapper
							id={ clientId }
							onToggle={ setResponsiveMenuVisibility }
							label={ __( 'Menu' ) }
							hasIcon={ hasIcon }
							icon={ icon }
							isOpen={ isResponsiveMenuOpen }
							isResponsive={ isResponsive }
							isHiddenByDefault={ 'always' === overlayMenu }
							overlayBackgroundColor={ overlayBackgroundColor }
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
					</TagName>
				) }
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
