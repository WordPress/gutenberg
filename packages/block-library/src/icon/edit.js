/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Dropdown,
	DropdownMenu,
	ExternalLink,
	MenuGroup,
	MenuItem,
	NavigableMenu,
	TextControl,
	ToolbarButton,
	ToolbarGroup,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import {
	BlockControls,
	InspectorControls,
	MediaUpload,
	useBlockProps,
	useBlockEditingMode,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
} from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { DOWN } from '@wordpress/keycodes';
import { code, media as mediaIcon } from '@wordpress/icons';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import {
	CustomInserterModal,
	IconDropZone,
	IconPlaceholder,
	InserterModal,
} from './components';
import {
	flattenIconsArray,
	parseIcon,
	parseUploadedMediaAndSetIcon,
} from './utils';
import { bolt as defaultIcon } from './icons/bolt';
import getIcons from './icons';
import { useToolsPanelDropdownMenuProps } from './utils/hooks';

/**
 * The edit function for the Icon Block.
 *
 * @param {Object} props All props passed to this function.
 */
export function Edit( props ) {
	const { attributes, setAttributes } = props;
	const { icon, iconName, label, title } = attributes;

	// Allowed types for the current user.
	const { allowedMimeTypes, mediaUpload } = useSelect( ( select ) => {
		// Disabling this rule for the following line so as to not couple the block editor package to block-library.
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		const { getSettings } = select( 'core/block-editor' );

		return {
			allowedMimeTypes: getSettings().allowedMimeTypes,
			mediaUpload: getSettings().mediaUpload,
		};
	}, [] );

	const isSVGUploadAllowed = allowedMimeTypes
		? Object.values( allowedMimeTypes ).includes( 'image/svg+xml' )
		: false;

	const [ isInserterOpen, setInserterOpen ] = useState( false );
	const [ isQuickInserterOpen, setQuickInserterOpen ] = useState( false );
	const [ isCustomInserterOpen, setCustomInserterOpen ] = useState( false );

	// Allow users to disable custom SVG icons.
	const enableCustomIcons = applyFilters(
		'iconBlock.enableCustomIcons',
		true
	);

	const isContentOnlyMode = useBlockEditingMode() === 'contentOnly';

	const iconsAll = flattenIconsArray( getIcons() );
	const namedIcon = iconsAll.filter( ( i ) => i.name === iconName );
	const customIcon = defaultIcon;
	let printedIcon = '';
	if ( icon && namedIcon.length === 0 ) {
		printedIcon = parseIcon( icon );

		if (
			customIcon.props &&
			Object.keys( customIcon?.props ).length === 0
		) {
			printedIcon = defaultIcon;
		}
	} else {
		// Icon chosen from library.
		if ( icon.length === 0 && namedIcon.length > 0 ) {
			printedIcon = namedIcon[ 0 ]?.icon;
		} else {
			printedIcon = icon;
		}

		// Icons provided by third-parties are generally strings.
		if ( typeof printedIcon === 'string' ) {
			printedIcon = parseIcon( printedIcon );
		}
	}

	function resetAll() {
		setAttributes( {
			label: undefined,
		} );
	}

	const openOnArrowDown = ( event ) => {
		if ( event.keyCode === DOWN ) {
			event.preventDefault();
			event.target.click();
		}
	};

	const replaceText = icon || iconName ? __( 'Replace' ) : __( 'Add icon' );
	const customIconText =
		icon || iconName
			? __( 'Add/edit custom icon' )
			: __( 'Add custom icon' );

	const replaceDropdown = (
		<Dropdown
			renderToggle={ ( { isOpen, onToggle } ) => (
				<ToolbarButton
					aria-expanded={ isOpen }
					aria-haspopup="true"
					onClick={ onToggle }
					onKeyDown={ openOnArrowDown }
				>
					{ replaceText }
				</ToolbarButton>
			) }
			renderContent={ ( { onClose } ) => (
				<NavigableMenu>
					<MenuGroup>
						<MenuItem
							onClick={ () => {
								setInserterOpen( true );
								onClose( true );
							} }
							icon={ defaultIcon }
						>
							{ __( 'Browse Icon Library' ) }
						</MenuItem>
						{ isSVGUploadAllowed && (
							<MediaUpload
								onSelect={ ( media ) => {
									parseUploadedMediaAndSetIcon(
										media,
										attributes,
										setAttributes
									);
									onClose( true );
								} }
								allowedTypes={ [ 'image/svg+xml' ] }
								render={ ( { open } ) => (
									<MenuItem
										onClick={ open }
										icon={ mediaIcon }
									>
										{ __( 'Open Media Library' ) }
									</MenuItem>
								) }
							/>
						) }
						{ enableCustomIcons && (
							<MenuItem
								onClick={ () => {
									setCustomInserterOpen( true );
									onClose( true );
								} }
								icon={ code }
							>
								{ customIconText }
							</MenuItem>
						) }
					</MenuGroup>
					{ ( icon || iconName ) && (
						<MenuGroup>
							<MenuItem
								onClick={ () => {
									setAttributes( {
										icon: undefined,
										iconName: undefined,
									} );
									onClose( true );
								} }
							>
								{ __( 'Reset' ) }
							</MenuItem>
						</MenuGroup>
					) }
				</NavigableMenu>
			) }
		/>
	);

	const blockControls = (
		<>
			{ ( icon || iconName ) && (
				<BlockControls group="block">
					<ToolbarGroup
						className={ clsx( 'components-toolbar-group', {
							'wp-block-outermost-icon-block__toolbar':
								! isContentOnlyMode,
						} ) }
					></ToolbarGroup>
				</BlockControls>
			) }
			<BlockControls group={ isContentOnlyMode ? 'inline' : 'other' }>
				<>
					{ enableCustomIcons || isSVGUploadAllowed ? (
						replaceDropdown
					) : (
						<ToolbarButton
							onClick={ () => {
								setInserterOpen( true );
							} }
						>
							{ replaceText }
						</ToolbarButton>
					) }
				</>
			</BlockControls>
			{ isContentOnlyMode && ( icon || iconName ) && (
				// Add some extra controls for content attributes when content only mode is active.
				// With content only mode active, the inspector is hidden, so users need another way
				// to edit these attributes.
				<BlockControls group="other">
					<ToolbarGroup className="components-toolbar-group">
						<DropdownMenu
							icon=""
							popoverProps={ {
								className:
									'outermost-icon-block__replace-popover is-alternate',
							} }
							text={ __( 'Label' ) }
						>
							{ () => (
								<TextControl
									className="wp-block-outermost-icon-block__toolbar_content"
									label={ __( 'Label' ) }
									value={ label || '' }
									onChange={ ( value ) =>
										setAttributes( { label: value } )
									}
									help={ __(
										'Briefly describe the icon to help screen reader users.'
									) }
									__nextHasNoMarginBottom
									__next40pxDefaultSize
								/>
							) }
						</DropdownMenu>
					</ToolbarGroup>
				</BlockControls>
			) }
		</>
	);
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const inspectorControls = ( icon || iconName ) && (
		<>
			<InspectorControls group="settings">
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ resetAll }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Label' ) }
						isShownByDefault
						hasValue={ () => !! label }
						onDeselect={ () =>
							setAttributes( { label: undefined } )
						}
					>
						<TextControl
							label={ __( 'Label' ) }
							help={ __(
								'Briefly describe the icon to help screen reader users.'
							) }
							value={ label || '' }
							onChange={ ( value ) =>
								setAttributes( { label: value } )
							}
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>

			<InspectorControls group="advanced">
				<TextControl
					label={ __( 'Title attribute' ) }
					className="outermost-icon-block__title-control"
					value={ title || '' }
					onChange={ ( value ) => setAttributes( { title: value } ) }
					help={
						<>
							{ __(
								'Describe the role of this icon on the page.'
							) }
							<ExternalLink href="https://www.w3.org/TR/html52/dom.html#the-title-attribute">
								{ __(
									'Note: many devices and browsers do not display this text'
								) }
							</ExternalLink>
						</>
					}
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
			</InspectorControls>
		</>
	);

	const blockProps = useBlockProps();
	const borderProps = getBorderClassesAndStyles( attributes );

	const iconClasses = clsx( 'icon-container', borderProps?.className );

	const iconStyles = {
		...blockProps.style,
		...borderProps.style,

		// Margin is applied to the wrapper container, so unset.
		marginBottom: undefined,
		marginLeft: undefined,
		marginRight: undefined,
		marginTop: undefined,
	};

	// And even though margin is set on the main block div, we need to handle it
	// manually since all other styles are applied to the inner div.
	const blockMargin = {
		marginBottom: blockProps.style?.marginBottom,
		marginLeft: blockProps.style?.marginLeft,
		marginRight: blockProps.style?.marginRight,
		marginTop: blockProps.style?.marginTop,
	};

	const iconMarkup = (
		<>
			{ ! icon && ! iconName ? (
				<IconPlaceholder
					setInserterOpen={ setInserterOpen }
					isQuickInserterOpen={ isQuickInserterOpen }
					setQuickInserterOpen={ setQuickInserterOpen }
					isCustomInserterOpen={ isCustomInserterOpen }
					setCustomInserterOpen={ setCustomInserterOpen }
					attributes={ attributes }
					setAttributes={ setAttributes }
					enableCustomIcons={ enableCustomIcons }
					isSVGUploadAllowed={ isSVGUploadAllowed }
				/>
			) : (
				<div className={ iconClasses } style={ iconStyles }>
					{ printedIcon }
				</div>
			) }
		</>
	);

	return (
		<>
			{ blockControls }
			{ inspectorControls }
			<div
				{ ...useBlockProps() }
				// This is a bit of a hack. we only want the margin styles
				// applied to the main block div.
				style={ blockMargin }
			>
				{ iconMarkup }
				<IconDropZone
					attributes={ attributes }
					setAttributes={ setAttributes }
					mediaUpload={ mediaUpload }
					isSVGUploadAllowed={ isSVGUploadAllowed }
				/>
			</div>
			<InserterModal
				isInserterOpen={ isInserterOpen }
				setInserterOpen={ setInserterOpen }
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
			{ enableCustomIcons && (
				<CustomInserterModal
					isCustomInserterOpen={ isCustomInserterOpen }
					setCustomInserterOpen={ setCustomInserterOpen }
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
			) }
		</>
	);
}

export default Edit;
