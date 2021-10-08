/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef, Platform } from '@wordpress/element';
import {
	InspectorControls,
	JustifyToolbar,
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
import { useDispatch, useSelect, withDispatch } from '@wordpress/data';
import { PanelBody, ToggleControl, ToolbarGroup } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useBlockNavigator from '../use-block-navigator';
import useTemplatePartEntity from '../use-template-part';
import NavigationPlaceholder from './placeholder';
import ResponsiveWrapper from './responsive-wrapper';

// TODO - refactor these to somewhere common?
import TemplatePartPlaceholder from '../../template-part/edit/placeholder';
import NavigationInnerBlocks from './inner-blocks';

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
	updateInnerBlocks,
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
	hasItemJustificationControls = true,
	hasColorSettings = true,
	customPlaceholder: CustomPlaceholder = null,
	customAppender: CustomAppender = null,
} ) {
	const {
		slug,
		area: blockArea,
		itemsJustification,
		isResponsive,
		openSubmenusOnClick,
		orientation,
	} = attributes;

	const templatePartId = slug;
	const [ hasAlreadyRendered, RecursionProvider ] = useNoRecursiveRenders(
		templatePartId
	);

	const innerBlocks = useSelect(
		( select ) => select( blockEditorStore ).getBlocks( clientId ),
		[ clientId ]
	);
	const hasExistingNavItems = !! innerBlocks.length;
	const { selectBlock } = useDispatch( blockEditorStore );

	const [
		isNavigationPlaceholderShown,
		setIsNavigationPlaceholderShown,
	] = useState( ! hasExistingNavItems );

	const [ isResponsiveMenuOpen, setResponsiveMenuVisibility ] = useState(
		false
	);

	const {
		isResolved,
		isMissing,
		area,
		enableSelection,
		hasResolvedReplacements,
	} = useTemplatePartEntity( templatePartId, blockArea );

	const navRef = useRef();

	const { navigatorToolbarButton, navigatorModal } = useBlockNavigator(
		clientId
	);

	const isTemplatePartPlaceholderShown = ! slug;
	const isEntityAvailable =
		! isTemplatePartPlaceholderShown && ! isMissing && isResolved;

	const blockProps = useBlockProps( {
		ref: navRef,
		className: classnames( className, {
			[ `items-justified-${ itemsJustification }` ]: itemsJustification,
			'is-vertical': orientation === 'vertical',
			'is-responsive': isResponsive,
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

	// Turn on contrast checker for web only since it's not supported on mobile yet.
	const enableContrastChecking = Platform.OS === 'web';

	const [ detectedBackgroundColor, setDetectedBackgroundColor ] = useState();
	const [ detectedColor, setDetectedColor ] = useState();
	const [
		detectedOverlayBackgroundColor,
		setDetectedOverlayBackgroundColor,
	] = useState();
	const [ detectedOverlayColor, setDetectedOverlayColor ] = useState();

	useEffect( () => {
		if ( ! enableContrastChecking ) {
			return;
		}
		detectColors(
			navRef.current,
			setDetectedColor,
			setDetectedBackgroundColor
		);
		const subMenuElement = navRef.current.querySelector(
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

	// We don't want to render a missing state if we have any inner blocks.
	// A new template part is automatically created if we have any inner blocks but no entity.
	if ( innerBlocks.length === 0 && isMissing ) {
		return (
			<div { ...blockProps }>
				<Warning>
					{ sprintf(
						/* translators: %s: Template part slug */
						__(
							'Navigation block has been deleted or is unavailable: %s'
						),
						slug
					) }
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
		: NavigationPlaceholder;

	const justifyAllowedControls =
		orientation === 'vertical'
			? [ 'left', 'center', 'right' ]
			: [ 'left', 'center', 'right', 'space-between' ];

	return (
		<RecursionProvider>
			<BlockControls>
				{ hasItemJustificationControls && (
					<JustifyToolbar
						value={ itemsJustification }
						allowedControls={ justifyAllowedControls }
						onChange={ ( value ) =>
							setAttributes( { itemsJustification: value } )
						}
						popoverProps={ {
							position: 'bottom right',
							isAlternate: true,
						} }
					/>
				) }
				<ToolbarGroup>{ navigatorToolbarButton }</ToolbarGroup>
			</BlockControls>
			{ navigatorModal }
			<InspectorControls>
				{ hasSubmenuIndicatorSetting && (
					<PanelBody title={ __( 'Display settings' ) }>
						<ToggleControl
							checked={ isResponsive }
							onChange={ ( value ) => {
								setAttributes( {
									isResponsive: value,
								} );
							} }
							label={ __( 'Enable responsive menu' ) }
						/>
						<ToggleControl
							checked={ openSubmenusOnClick }
							onChange={ ( value ) => {
								setAttributes( {
									openSubmenusOnClick: value,
								} );
							} }
							label={ __( 'Open submenus on click' ) }
						/>
						{ ! attributes.openSubmenusOnClick && (
							<ToggleControl
								checked={ attributes.showSubmenuIcon }
								onChange={ ( value ) => {
									setAttributes( {
										showSubmenuIcon: value,
									} );
								} }
								label={ __( 'Show submenu indicator icons' ) }
							/>
						) }
					</PanelBody>
				) }
				{ hasColorSettings && (
					<PanelColorSettings
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
								label: __( 'Overlay text' ),
							},
							{
								value: overlayBackgroundColor.color,
								onChange: setOverlayBackgroundColor,
								label: __( 'Overlay background' ),
							},
						] }
					>
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
					</PanelColorSettings>
				) }
			</InspectorControls>
			<nav { ...blockProps }>
				{ isTemplatePartPlaceholderShown && (
					<TemplatePartPlaceholder
						area={ area }
						clientId={ clientId }
						setAttributes={ setAttributes }
						enableSelection={ enableSelection }
						hasResolvedReplacements={ hasResolvedReplacements }
					/>
				) }
				{ ! hasExistingNavItems &&
					! isTemplatePartPlaceholderShown &&
					isNavigationPlaceholderShown && (
						<PlaceholderComponent
							onCreate={ ( blocks, selectNavigationBlock ) => {
								setIsNavigationPlaceholderShown( false );
								updateInnerBlocks( blocks );
								if ( selectNavigationBlock ) {
									selectBlock( clientId );
								}
							} }
						/>
					) }
				<ResponsiveWrapper
					id={ clientId }
					onToggle={ setResponsiveMenuVisibility }
					isOpen={ isResponsiveMenuOpen }
					isResponsive={ isResponsive }
				>
					{ isEntityAvailable && (
						<NavigationInnerBlocks
							isVisible={
								hasExistingNavItems ||
								! isNavigationPlaceholderShown
							}
							templatePartId={ templatePartId }
							clientId={ clientId }
							appender={ CustomAppender }
							hasCustomPlaceholder={ !! CustomPlaceholder }
							orientation={ orientation }
						/>
					) }
				</ResponsiveWrapper>
			</nav>
		</RecursionProvider>
	);
}

export default compose( [
	withDispatch( ( dispatch, { clientId } ) => {
		return {
			updateInnerBlocks( blocks ) {
				if ( blocks?.length === 0 ) {
					return false;
				}
				dispatch( blockEditorStore ).replaceInnerBlocks(
					clientId,
					blocks,
					true
				);
			},
		};
	} ),
	withColors(
		{ textColor: 'color' },
		{ backgroundColor: 'color' },
		{ overlayBackgroundColor: 'color' },
		{ overlayTextColor: 'color' }
	),
] )( Navigation );
