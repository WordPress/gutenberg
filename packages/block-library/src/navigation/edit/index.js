/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	useState,
	useEffect,
	useRef,
	useCallback,
	Platform,
} from '@wordpress/element';
import {
	InspectorControls,
	BlockControls,
	useBlockProps,
	__experimentalUseNoRecursiveRenders as useNoRecursiveRenders,
	store as blockEditorStore,
	withColors,
	PanelColorSettings,
	ContrastChecker,
	getColorClassName,
	Warning,
} from '@wordpress/block-editor';
import { EntityProvider, useEntityProp } from '@wordpress/core-data';

import { useDispatch, useSelect, useRegistry } from '@wordpress/data';
import {
	PanelBody,
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	ToolbarGroup,
	Button,
	Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import useListViewModal from './use-list-view-modal';
import useNavigationMenu from '../use-navigation-menu';
import useNavigationEntities from '../use-navigation-entities';
import Placeholder from './placeholder';
import ResponsiveWrapper from './responsive-wrapper';
import NavigationInnerBlocks from './inner-blocks';
import NavigationMenuSelector from './navigation-menu-selector';
import NavigationMenuNameControl from './navigation-menu-name-control';
import UnsavedInnerBlocks from './unsaved-inner-blocks';
import NavigationMenuDeleteControl from './navigation-menu-delete-control';
import useNavigationNotice from './use-navigation-notice';
import OverlayMenuIcon from './overlay-menu-icon';
import useConvertClassicToBlockMenu, {
	CLASSIC_MENU_CONVERSION_ERROR,
	CLASSIC_MENU_CONVERSION_PENDING,
	CLASSIC_MENU_CONVERSION_SUCCESS,
} from './use-convert-classic-menu-to-block-menu';

const EMPTY_ARRAY = [];

function getComputedStyle( node ) {
	return node.ownerDocument.defaultView.getComputedStyle( node );
}

function detectColors( colorsDetectionElement, setColor, setBackground ) {
	if ( ! colorsDetectionElement ) {
		return;
	}
	setColor( getComputedStyle( colorsDetectionElement ).color );

	let backgroundColorNode = colorsDetectionElement;
	let backgroundColor = getComputedStyle( backgroundColorNode )
		.backgroundColor;
	while (
		backgroundColor === 'rgba(0, 0, 0, 0)' &&
		backgroundColorNode.parentNode &&
		backgroundColorNode.parentNode.nodeType ===
			backgroundColorNode.parentNode.ELEMENT_NODE
	) {
		backgroundColorNode = backgroundColorNode.parentNode;
		backgroundColor = getComputedStyle( backgroundColorNode )
			.backgroundColor;
	}

	setBackground( backgroundColor );
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
	context: { navigationArea },

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
		layout: {
			justifyContent,
			orientation = 'horizontal',
			flexWrap = 'wrap',
		} = {},
		hasIcon,
	} = attributes;

	let areaMenu,
		setAreaMenu = noop;
	// Navigation areas are deprecated and on their way out. Let's not perform
	// the request unless we're in an environment where the endpoint exists.
	if ( process.env.IS_GUTENBERG_PLUGIN ) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		[ areaMenu, setAreaMenu ] = useEntityProp(
			'root',
			'navigationArea',
			'navigation',
			navigationArea
		);
	}

	const navigationAreaMenu = areaMenu === 0 ? undefined : areaMenu;

	const ref = navigationArea ? navigationAreaMenu : attributes.ref;

	const registry = useRegistry();
	const setRef = useCallback(
		( postId ) => {
			setAttributes( { ref: postId } );
			if ( navigationArea ) {
				setAreaMenu( postId );
			}
		},
		[ navigationArea ]
	);

	const [ hasAlreadyRendered, RecursionProvider ] = useNoRecursiveRenders(
		`navigationMenu/${ ref }`
	);

	// Preload classic menus, so that they don't suddenly pop-in when viewing
	// the Select Menu dropdown.
	useNavigationEntities();

	const {
		hasUncontrolledInnerBlocks,
		uncontrolledInnerBlocks,
		isInnerBlockSelected,
		hasSubmenus,
	} = useSelect(
		( select ) => {
			const { getBlock, getBlocks, hasSelectedInnerBlock } = select(
				blockEditorStore
			);

			// This relies on the fact that `getBlock` won't return controlled
			// inner blocks, while `getBlocks` does. It might be more stable to
			// introduce a selector like `getUncontrolledInnerBlocks`, just in
			// case `getBlock` is fixed.
			const _uncontrolledInnerBlocks = getBlock( clientId ).innerBlocks;
			const _hasUncontrolledInnerBlocks = !! _uncontrolledInnerBlocks?.length;
			const _controlledInnerBlocks = _hasUncontrolledInnerBlocks
				? EMPTY_ARRAY
				: getBlocks( clientId );
			const innerBlocks = _hasUncontrolledInnerBlocks
				? _uncontrolledInnerBlocks
				: _controlledInnerBlocks;

			return {
				hasSubmenus: !! innerBlocks.find(
					( block ) => block.name === 'core/navigation-submenu'
				),
				hasUncontrolledInnerBlocks: _hasUncontrolledInnerBlocks,
				uncontrolledInnerBlocks: _uncontrolledInnerBlocks,
				isInnerBlockSelected: hasSelectedInnerBlock( clientId, true ),
			};
		},
		[ clientId ]
	);
	const {
		replaceInnerBlocks,
		selectBlock,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	const [
		hasSavedUnsavedInnerBlocks,
		setHasSavedUnsavedInnerBlocks,
	] = useState( false );

	const isWithinUnassignedArea = !! navigationArea && ! ref;

	const [ isResponsiveMenuOpen, setResponsiveMenuVisibility ] = useState(
		false
	);

	const [ overlayMenuPreview, setOverlayMenuPreview ] = useState( false );

	const {
		isNavigationMenuResolved,
		isNavigationMenuMissing,
		navigationMenus,
		navigationMenu,
		canUserUpdateNavigationMenu,
		hasResolvedCanUserUpdateNavigationMenu,
		canUserDeleteNavigationMenu,
		hasResolvedCanUserDeleteNavigationMenu,
		canUserCreateNavigationMenu,
		isResolvingCanUserCreateNavigationMenu,
		hasResolvedCanUserCreateNavigationMenu,
	} = useNavigationMenu( ref );

	const navRef = useRef();
	const isDraftNavigationMenu = navigationMenu?.status === 'draft';

	const { listViewToolbarButton, listViewModal } = useListViewModal(
		clientId
	);

	const {
		convert,
		status: classicMenuConversionStatus,
		error: classicMenuConversionError,
		value: classicMenuConversionResult,
	} = useConvertClassicToBlockMenu( clientId );

	const isConvertingClassicMenu =
		classicMenuConversionStatus === CLASSIC_MENU_CONVERSION_PENDING;

	// The standard HTML5 tag for the block wrapper.
	const TagName = 'nav';

	// "placeholder" shown if:
	// - we don't have a ref attribute pointing to a Navigation Post.
	// - we are not running a menu conversion process.
	// - we don't have uncontrolled blocks.
	// - (legacy) we have a Navigation Area without a ref attribute pointing to a Navigation Post.
	const isPlaceholder =
		! ref &&
		! isConvertingClassicMenu &&
		( ! hasUncontrolledInnerBlocks || isWithinUnassignedArea );

	const isEntityAvailable =
		! isNavigationMenuMissing && isNavigationMenuResolved;

	// "loading" state:
	// - we are running the Classic Menu conversion process.
	// OR
	// - there is a ref attribute pointing to a Navigation Post
	// - the Navigation Post isn't available (hasn't resolved) yet.
	const isLoading =
		isConvertingClassicMenu ||
		!! ( ref && ! isEntityAvailable && ! isConvertingClassicMenu );

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
			[ getColorClassName(
				'color',
				textColor?.slug
			) ]: !! textColor?.slug,
			'has-background': !! backgroundColor.color || backgroundColor.class,
			[ getColorClassName(
				'background-color',
				backgroundColor?.slug
			) ]: !! backgroundColor?.slug,
		} ),
		style: {
			color: ! textColor?.slug && textColor?.color,
			backgroundColor: ! backgroundColor?.slug && backgroundColor?.color,
		},
	} );

	const overlayClassnames = classnames( {
		'has-text-color':
			!! overlayTextColor.color || !! overlayTextColor?.class,
		[ getColorClassName(
			'color',
			overlayTextColor?.slug
		) ]: !! overlayTextColor?.slug,
		'has-background':
			!! overlayBackgroundColor.color || overlayBackgroundColor?.class,
		[ getColorClassName(
			'background-color',
			overlayBackgroundColor?.slug
		) ]: !! overlayBackgroundColor?.slug,
	} );

	const overlayStyles = {
		color: ! overlayTextColor?.slug && overlayTextColor?.color,
		backgroundColor:
			! overlayBackgroundColor?.slug &&
			overlayBackgroundColor?.color &&
			overlayBackgroundColor.color,
	};

	// Turn on contrast checker for web only since it's not supported on mobile yet.
	const enableContrastChecking = Platform.OS === 'web';

	const [ detectedBackgroundColor, setDetectedBackgroundColor ] = useState();
	const [ detectedColor, setDetectedColor ] = useState();
	const [
		detectedOverlayBackgroundColor,
		setDetectedOverlayBackgroundColor,
	] = useState();
	const [ detectedOverlayColor, setDetectedOverlayColor ] = useState();

	const [
		showClassicMenuConversionErrorNotice,
		hideClassicMenuConversionErrorNotice,
	] = useNavigationNotice( {
		name: 'block-library/core/navigation/classic-menu-conversion/error',
	} );

	function handleUpdateMenu( menuId ) {
		setRef( menuId );
		selectBlock( clientId );
	}

	useEffect( () => {
		if ( classicMenuConversionStatus === CLASSIC_MENU_CONVERSION_PENDING ) {
			speak( __( 'Classic menu importing.' ) );
		}

		if (
			classicMenuConversionStatus === CLASSIC_MENU_CONVERSION_SUCCESS &&
			classicMenuConversionResult
		) {
			handleUpdateMenu( classicMenuConversionResult?.id );
			hideClassicMenuConversionErrorNotice();
			speak( __( 'Classic menu imported successfully.' ) );
		}

		if ( classicMenuConversionStatus === CLASSIC_MENU_CONVERSION_ERROR ) {
			showClassicMenuConversionErrorNotice( classicMenuConversionError );
			speak( __( 'Classic menu import failed.' ) );
		}
	}, [
		classicMenuConversionStatus,
		classicMenuConversionResult,
		classicMenuConversionError,
	] );

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
			'[data-type="core/navigation-link"] [data-type="core/navigation-link"]'
		);
		if ( subMenuElement ) {
			detectColors(
				subMenuElement,
				setDetectedOverlayColor,
				setDetectedOverlayBackgroundColor
			);
		}
	} );

	const [ showCantEditNotice, hideCantEditNotice ] = useNavigationNotice( {
		name: 'block-library/core/navigation/permissions/update',
		message: __(
			'You do not have permission to edit this Menu. Any changes made will not be saved.'
		),
	} );

	const [ showCantCreateNotice, hideCantCreateNotice ] = useNavigationNotice(
		{
			name: 'block-library/core/navigation/permissions/create',
			message: __(
				'You do not have permission to create Navigation Menus.'
			),
		}
	);

	useEffect( () => {
		if ( ! isSelected && ! isInnerBlockSelected ) {
			hideCantEditNotice();
			hideCantCreateNotice();
		}

		if ( isSelected || isInnerBlockSelected ) {
			if (
				hasResolvedCanUserUpdateNavigationMenu &&
				! canUserUpdateNavigationMenu
			) {
				showCantEditNotice();
			}

			if (
				! ref &&
				hasResolvedCanUserCreateNavigationMenu &&
				! canUserCreateNavigationMenu
			) {
				showCantCreateNotice();
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

	const handleSelectNavigation = ( navPostOrClassicMenu ) => {
		if ( ! navPostOrClassicMenu ) {
			return;
		}

		const isClassicMenu = navPostOrClassicMenu?.hasOwnProperty(
			'auto_add'
		);

		if ( isClassicMenu ) {
			convert( navPostOrClassicMenu.id, navPostOrClassicMenu.name );
		} else {
			handleUpdateMenu( navPostOrClassicMenu?.id );
		}
	};

	const startWithEmptyMenu = useCallback( () => {
		registry.batch( () => {
			if ( navigationArea ) {
				setAreaMenu( 0 );
			}
			setAttributes( {
				ref: undefined,
			} );
			if ( ! ref ) {
				replaceInnerBlocks( clientId, [] );
			}
		} );
	}, [ clientId, ref ] );

	// If the block has inner blocks, but no menu id, this was an older
	// navigation block added before the block used a wp_navigation entity.
	// Either this block was saved in the content or inserted by a pattern.
	// Consider this 'unsaved'. Offer an uncontrolled version of inner blocks,
	// that automatically saves the menu.
	const hasUnsavedBlocks = hasUncontrolledInnerBlocks && ! isEntityAvailable;
	if ( hasUnsavedBlocks ) {
		return (
			<TagName { ...blockProps }>
				<ResponsiveWrapper
					id={ clientId }
					onToggle={ setResponsiveMenuVisibility }
					isOpen={ isResponsiveMenuOpen }
					isResponsive={ 'never' !== overlayMenu }
					isHiddenByDefault={ 'always' === overlayMenu }
					classNames={ overlayClassnames }
					styles={ overlayStyles }
				>
					<UnsavedInnerBlocks
						blockProps={ blockProps }
						blocks={ uncontrolledInnerBlocks }
						clientId={ clientId }
						navigationMenus={ navigationMenus }
						hasSelection={ isSelected || isInnerBlockSelected }
						hasSavedUnsavedInnerBlocks={
							hasSavedUnsavedInnerBlocks
						}
						onSave={ ( post ) => {
							// Set some state used as a guard to prevent the creation of multiple posts.
							setHasSavedUnsavedInnerBlocks( true );
							// Switch to using the wp_navigation entity.
							setRef( post.id );
						} }
					/>
				</ResponsiveWrapper>
			</TagName>
		);
	}

	// Show a warning if the selected menu is no longer available.
	// TODO - the user should be able to select a new one?
	if ( ref && isNavigationMenuMissing ) {
		return (
			<div { ...blockProps }>
				<Warning>
					{ __(
						'Navigation menu has been deleted or is unavailable. '
					) }
					<Button onClick={ startWithEmptyMenu } variant="link">
						{ __( 'Create a new menu?' ) }
					</Button>
				</Warning>
			</div>
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

	const isResponsive = 'never' !== overlayMenu;

	const overlayMenuPreviewClasses = classnames(
		'wp-block-navigation__overlay-menu-preview',
		{ open: overlayMenuPreview }
	);

	if ( isPlaceholder ) {
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
					onFinish={ handleSelectNavigation }
				/>
			</TagName>
		);
	}

	return (
		<EntityProvider kind="postType" type="wp_navigation" id={ ref }>
			<RecursionProvider>
				<BlockControls>
					{ ! isDraftNavigationMenu && isEntityAvailable && (
						<ToolbarGroup className="wp-block-navigation__toolbar-menu-selector">
							<NavigationMenuSelector
								currentMenuId={ ref }
								clientId={ clientId }
								onSelect={ handleSelectNavigation }
								onCreateNew={ startWithEmptyMenu }
								/* translators: %s: The name of a menu. */
								actionLabel={ __( "Switch to '%s'" ) }
								showManageActions
							/>
						</ToolbarGroup>
					) }
					<ToolbarGroup>{ listViewToolbarButton }</ToolbarGroup>
				</BlockControls>
				{ listViewModal }
				<InspectorControls>
					{ hasSubmenuIndicatorSetting && (
						<PanelBody title={ __( 'Display' ) }>
							{ isResponsive && (
								<Button
									className={ overlayMenuPreviewClasses }
									onClick={ () => {
										setOverlayMenuPreview(
											! overlayMenuPreview
										);
									} }
								>
									{ hasIcon && <OverlayMenuIcon /> }
									{ ! hasIcon && (
										<span>{ __( 'Menu' ) }</span>
									) }
								</Button>
							) }
							{ overlayMenuPreview && (
								<ToggleControl
									label={ __( 'Show icon button' ) }
									help={ __(
										'Configure the visual appearance of the button opening the overlay menu.'
									) }
									onChange={ ( value ) =>
										setAttributes( { hasIcon: value } )
									}
									checked={ hasIcon }
								/>
							) }
							<h3>{ __( 'Overlay Menu' ) }</h3>
							<ToggleGroupControl
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
										disabled={
											attributes.openSubmenusOnClick
										}
										label={ __( 'Show arrow' ) }
									/>
								</>
							) }
						</PanelBody>
					) }
					{ hasColorSettings && (
						<PanelColorSettings
							__experimentalHasMultipleOrigins
							__experimentalIsRenderedInSidebar
							title={ __( 'Color' ) }
							initialOpen={ false }
							colorSettings={ [
								{
									value: textColor.color,
									onChange: setTextColor,
									label: __( 'Text' ),
								},
								{
									value: backgroundColor.color,
									onChange: setBackgroundColor,
									label: __( 'Background' ),
								},
								{
									value: overlayTextColor.color,
									onChange: setOverlayTextColor,
									label: __( 'Submenu & overlay text' ),
								},
								{
									value: overlayBackgroundColor.color,
									onChange: setOverlayBackgroundColor,
									label: __( 'Submenu & overlay background' ),
								},
							] }
						>
							{ enableContrastChecking && (
								<>
									<ContrastChecker
										backgroundColor={
											detectedBackgroundColor
										}
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
						</PanelColorSettings>
					) }
				</InspectorControls>
				{ isEntityAvailable && (
					<InspectorControls __experimentalGroup="advanced">
						{ hasResolvedCanUserUpdateNavigationMenu &&
							canUserUpdateNavigationMenu && (
								<NavigationMenuNameControl />
							) }
						{ hasResolvedCanUserDeleteNavigationMenu &&
							canUserDeleteNavigationMenu && (
								<NavigationMenuDeleteControl
									onDelete={ startWithEmptyMenu }
								/>
							) }
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
							isOpen={ isResponsiveMenuOpen }
							isResponsive={ isResponsive }
							isHiddenByDefault={ 'always' === overlayMenu }
							classNames={ overlayClassnames }
							styles={ overlayStyles }
						>
							{ isEntityAvailable && (
								<NavigationInnerBlocks
									clientId={ clientId }
									hasCustomPlaceholder={
										!! CustomPlaceholder
									}
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
