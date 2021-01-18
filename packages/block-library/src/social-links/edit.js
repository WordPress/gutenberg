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
	ContrastChecker,
	PanelColorSettings,
	withColors,
} from '@wordpress/block-editor';
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	PanelBody,
	ToggleControl,
	ToolbarItem,
	ToolbarGroup,
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

export function SocialLinksEdit( { attributes, setAttributes } ) {
	const {
		iconBackgroundColorValue,
		iconColorValue,
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
		<div className="wp-block-social-links__social-placeholder">
			<div className="wp-social-link"></div>
			<div className="wp-block-social-links__social-placeholder-icons">
				<div className="wp-social-link wp-social-link-twitter"></div>
				<div className="wp-social-link wp-social-link-facebook"></div>
				<div className="wp-social-link wp-social-link-instagram"></div>
			</div>
		</div>
	);

	const className = classNames( size, {
		'has-icon-color': iconColorValue,
		'has-icon-background-color': iconBackgroundColorValue,
	} );

	const style = {
		'--wp--social-links--icon-color': iconColorValue,
		'--wp--social-links--icon-background-color': iconBackgroundColorValue,
	};

	const blockProps = useBlockProps( { className, style } );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		orientation: 'horizontal',
		placeholder: SocialPlaceholder,
		templateLock: false,
		__experimentalAppenderTagName: 'li',
	} );

	const POPOVER_PROPS = {
		position: 'bottom right',
		isAlternate: true,
	};

	return (
		<Fragment>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarItem>
						{ ( toggleProps ) => (
							<DropdownMenu
								label={ __( 'Size' ) }
								text={ __( 'Size' ) }
								icon={ null }
								popoverProps={ POPOVER_PROPS }
								toggleProps={ toggleProps }
							>
								{ ( { onClose } ) => (
									<MenuGroup>
										{ sizeOptions.map( ( entry ) => {
											return (
												<MenuItem
													icon={
														( size ===
															entry.value ||
															( ! size &&
																entry.value ===
																	'has-normal-icon-size' ) ) &&
														check
													}
													isSelected={
														size === entry.value
													}
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
							</DropdownMenu>
						) }
					</ToolbarItem>
				</ToolbarGroup>
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
					title={ __( 'Color settings' ) }
					colorSettings={ [
						{
							// Using custom attribute as it prevents loss of named color selection when
							// switching themes to a new theme that does not have a matching named color.
							value: iconColorValue,
							onChange: ( colorValue ) => {
								// Set explicit color value used to add CSS variable in save.js
								setAttributes( { iconColorValue: colorValue } );
							},
							label: __( 'Icon color' ),
						},
						! logosOnly && {
							// Using custom attribute as it prevents loss of named color selection when
							// switching themes to a new theme that does not have a matching named color.
							value: iconBackgroundColorValue,
							onChange: ( colorValue ) => {
								// Set explicit color value used to add CSS variable in save.js
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
