/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */

import { Fragment, useEffect } from '@wordpress/element';

import {
	BlockControls,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	useBlockProps,
	InspectorControls,
	JustifyContentControl,
	ContrastChecker,
	PanelColorSettings,
	withColors,
} from '@wordpress/block-editor';
import {
	MenuGroup,
	MenuItem,
	PanelBody,
	ToggleControl,
	ToolbarDropdownMenu,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';

const ALLOWED_BLOCKS = [ 'core/social-link' ];

const sizeOptions = [
	{ name: __( 'Small' ), value: 'has-small-icon-size' },
	{ name: __( 'Normal' ), value: 'has-normal-icon-size' },
	{ name: __( 'Large' ), value: 'has-large-icon-size' },
	{ name: __( 'Huge' ), value: 'has-huge-icon-size' },
];

export function SocialLinksEdit( props ) {
	const {
		attributes,
		iconBackgroundColor,
		iconColor,
		isSelected,
		setAttributes,
		setIconBackgroundColor,
		setIconColor,
	} = props;

	const {
		iconBackgroundColorValue,
		iconColorValue,
		itemsJustification,
		openInNewTab,
		size,
	} = attributes;

	// Remove icon background color if logos only style selected.
	const logosOnly =
		attributes.className?.indexOf( 'is-style-logos-only' ) >= 0;
	useEffect( () => {
		if ( logosOnly ) {
			setAttributes( {
				iconBackgroundColor: undefined,
				customIconBackgroundColor: undefined,
				iconBackgroundColorValue: undefined,
			} );
		}
	}, [ logosOnly, setAttributes ] );

	const SocialPlaceholder = (
		<li className="wp-block-social-links__social-placeholder">
			<div className="wp-social-link"></div>
			<div className="wp-block-social-links__social-placeholder-icons">
				<div className="wp-social-link wp-social-link-twitter"></div>
				<div className="wp-social-link wp-social-link-facebook"></div>
				<div className="wp-social-link wp-social-link-instagram"></div>
			</div>
		</li>
	);

	const SelectedSocialPlaceholder = (
		<li className="wp-block-social-links__social-prompt">
			{ __( 'Click plus to add' ) }
		</li>
	);

	// Fallback color values are used maintain selections in case switching
	// themes and named colors in palette do not match.
	const className = classNames( size, {
		'has-icon-color': iconColor.color || iconColorValue,
		'has-icon-background-color':
			iconBackgroundColor.color || iconBackgroundColorValue,
		[ `items-justified-${ itemsJustification }` ]: itemsJustification,
	} );

	const blockProps = useBlockProps( { className } );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		orientation: 'horizontal',
		placeholder: isSelected ? SelectedSocialPlaceholder : SocialPlaceholder,
		templateLock: false,
		__experimentalAppenderTagName: 'li',
	} );

	const POPOVER_PROPS = {
		position: 'bottom right',
		isAlternate: true,
	};

	return (
		<Fragment>
			<BlockControls group="block">
				<JustifyContentControl
					allowedControls={ [
						'left',
						'center',
						'right',
						'space-between',
					] }
					value={ itemsJustification }
					onChange={ ( value ) =>
						setAttributes( { itemsJustification: value } )
					}
					popoverProps={ {
						position: 'bottom right',
						isAlternate: true,
					} }
				/>
			</BlockControls>
			<BlockControls group="other">
				<ToolbarDropdownMenu
					label={ __( 'Size' ) }
					text={ __( 'Size' ) }
					icon={ null }
					popoverProps={ POPOVER_PROPS }
				>
					{ ( { onClose } ) => (
						<MenuGroup>
							{ sizeOptions.map( ( entry ) => {
								return (
									<MenuItem
										icon={
											( size === entry.value ||
												( ! size &&
													entry.value ===
														'has-normal-icon-size' ) ) &&
											check
										}
										isSelected={ size === entry.value }
										key={ entry.value }
										onClick={ () => {
											setAttributes( {
												size: entry.value,
											} );
										} }
										onClose={ onClose }
										role="menuitemradio"
									>
										{ entry.name }
									</MenuItem>
								);
							} ) }
						</MenuGroup>
					) }
				</ToolbarDropdownMenu>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Link settings' ) }>
					<ToggleControl
						label={ __( 'Open links in new tab' ) }
						checked={ openInNewTab }
						onChange={ () =>
							setAttributes( { openInNewTab: ! openInNewTab } )
						}
					/>
				</PanelBody>
				<PanelColorSettings
					title={ __( 'Color' ) }
					colorSettings={ [
						{
							// Use custom attribute as fallback to prevent loss of named color selection when
							// switching themes to a new theme that does not have a matching named color.
							value: iconColor.color || iconColorValue,
							onChange: ( colorValue ) => {
								setIconColor( colorValue );
								setAttributes( { iconColorValue: colorValue } );
							},
							label: __( 'Icon color' ),
						},
						! logosOnly && {
							// Use custom attribute as fallback to prevent loss of named color selection when
							// switching themes to a new theme that does not have a matching named color.
							value:
								iconBackgroundColor.color ||
								iconBackgroundColorValue,
							onChange: ( colorValue ) => {
								setIconBackgroundColor( colorValue );
								setAttributes( {
									iconBackgroundColorValue: colorValue,
								} );
							},
							label: __( 'Icon background color' ),
						},
					] }
				/>
				{ ! logosOnly && (
					<ContrastChecker
						{ ...{
							textColor: iconColorValue,
							backgroundColor: iconBackgroundColorValue,
						} }
						isLargeText={ false }
					/>
				) }
			</InspectorControls>
			<ul { ...innerBlocksProps } />
		</Fragment>
	);
}

const iconColorAttributes = {
	iconColor: 'icon-color',
	iconBackgroundColor: 'icon-background-color',
};

export default withColors( iconColorAttributes )( SocialLinksEdit );
