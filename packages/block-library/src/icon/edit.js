/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	DropdownMenu,
	ExternalLink,
	TextControl,
	ToolbarButton,
	ToolbarGroup,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import {
	BlockControls,
	InspectorControls,
	useBlockProps,
	useBlockEditingMode,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
} from '@wordpress/block-editor';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { IconPlaceholder, InserterModal } from './components';
import { flattenIconsArray, parseIcon } from './utils';
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

	const [ isInserterOpen, setInserterOpen ] = useState( false );
	const [ isQuickInserterOpen, setQuickInserterOpen ] = useState( false );

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

	const replaceText = icon || iconName ? __( 'Replace' ) : __( 'Add icon' );

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
				<ToolbarButton
					onClick={ () => {
						setInserterOpen( true );
					} }
				>
					{ replaceText }
				</ToolbarButton>
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
							) }{ ' ' }
							<ExternalLink href="https://www.w3.org/TR/html52/dom.html#the-title-attribute">
								{ __(
									'Note: many devices and browsers do not display this text.'
								) }
							</ExternalLink>
						</>
					}
					__next40pxDefaultSize
				/>
			</InspectorControls>
		</>
	);

	const borderProps = getBorderClassesAndStyles( attributes );

	const iconMarkup = (
		<>
			{ ! icon && ! iconName ? (
				<IconPlaceholder
					setInserterOpen={ setInserterOpen }
					isQuickInserterOpen={ isQuickInserterOpen }
					setQuickInserterOpen={ setQuickInserterOpen }
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
			) : (
				<>{ printedIcon }</>
			) }
		</>
	);

	return (
		<>
			{ blockControls }
			{ inspectorControls }
			<div
				{ ...useBlockProps( {
					className: borderProps?.className,
					style: { ...borderProps.style },
				} ) }
			>
				{ iconMarkup }
			</div>
			<InserterModal
				isInserterOpen={ isInserterOpen }
				setInserterOpen={ setInserterOpen }
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		</>
	);
}

export default Edit;
