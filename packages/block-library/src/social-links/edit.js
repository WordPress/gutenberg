/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import {
	BlockControls,
	useInnerBlocksProps,
	useBlockProps,
	InspectorControls,
	ContrastChecker,
	withColors,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
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

const sizeOptions = [
	{ name: __( 'Small' ), value: 'has-small-icon-size' },
	{ name: __( 'Normal' ), value: 'has-normal-icon-size' },
	{ name: __( 'Large' ), value: 'has-large-icon-size' },
	{ name: __( 'Huge' ), value: 'has-huge-icon-size' },
];

export function SocialLinksEdit( props ) {
	const {
		clientId,
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
		customIconBackgroundColor,
		iconColorValue,
		openInNewTab,
		showLabels,
		size,
	} = attributes;

	const logosOnly = attributes.className?.includes( 'is-style-logos-only' );

	// Remove icon background color when logos only style is selected or
	// restore it when any other style is selected.
	const backgroundBackup = useRef( {} );
	useEffect( () => {
		if ( logosOnly ) {
			backgroundBackup.current = {
				iconBackgroundColor,
				iconBackgroundColorValue,
				customIconBackgroundColor,
			};
			setAttributes( {
				iconBackgroundColor: undefined,
				customIconBackgroundColor: undefined,
				iconBackgroundColorValue: undefined,
			} );
		} else {
			setAttributes( { ...backgroundBackup.current } );
		}
	}, [ logosOnly ] );

	const SocialPlaceholder = (
		<li className="wp-block-social-links__social-placeholder">
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
		'has-visible-labels': showLabels,
		'has-icon-color': iconColor.color || iconColorValue,
		'has-icon-background-color':
			iconBackgroundColor.color || iconBackgroundColorValue,
	} );

	const blockProps = useBlockProps( { className } );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		placeholder: isSelected ? SelectedSocialPlaceholder : SocialPlaceholder,
		templateLock: false,
		orientation: attributes.layout?.orientation ?? 'horizontal',
		__experimentalAppenderTagName: 'li',
	} );

	const POPOVER_PROPS = {
		position: 'bottom right',
	};

	const colorSettings = [
		{
			// Use custom attribute as fallback to prevent loss of named color selection when
			// switching themes to a new theme that does not have a matching named color.
			value: iconColor.color || iconColorValue,
			onChange: ( colorValue ) => {
				setIconColor( colorValue );
				setAttributes( { iconColorValue: colorValue } );
			},
			label: __( 'Icon color' ),
			resetAllFilter: () => {
				setIconColor( undefined );
				setAttributes( { iconColorValue: undefined } );
			},
		},
	];

	if ( ! logosOnly ) {
		colorSettings.push( {
			// Use custom attribute as fallback to prevent loss of named color selection when
			// switching themes to a new theme that does not have a matching named color.
			value: iconBackgroundColor.color || iconBackgroundColorValue,
			onChange: ( colorValue ) => {
				setIconBackgroundColor( colorValue );
				setAttributes( {
					iconBackgroundColorValue: colorValue,
				} );
			},
			label: __( 'Icon background' ),
			resetAllFilter: () => {
				setIconBackgroundColor( undefined );
				setAttributes( { iconBackgroundColorValue: undefined } );
			},
		} );
	}

	const colorGradientSettings = useMultipleOriginColorsAndGradients();

	return (
		<>
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
				<PanelBody title={ __( 'Settings' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Open links in new tab' ) }
						checked={ openInNewTab }
						onChange={ () =>
							setAttributes( { openInNewTab: ! openInNewTab } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show labels' ) }
						checked={ showLabels }
						onChange={ () =>
							setAttributes( { showLabels: ! showLabels } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			{ colorGradientSettings.hasColorsOrGradients && (
				<InspectorControls group="color">
					{ colorSettings.map(
						( { onChange, label, value, resetAllFilter } ) => (
							<ColorGradientSettingsDropdown
								key={ `social-links-color-${ label }` }
								__experimentalIsRenderedInSidebar
								settings={ [
									{
										colorValue: value,
										label,
										onColorChange: onChange,
										isShownByDefault: true,
										resetAllFilter,
										enableAlpha: true,
									},
								] }
								panelId={ clientId }
								{ ...colorGradientSettings }
							/>
						)
					) }
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
			) }
			<ul { ...innerBlocksProps } />
		</>
	);
}

const iconColorAttributes = {
	iconColor: 'icon-color',
	iconBackgroundColor: 'icon-background-color',
};

export default withColors( iconColorAttributes )( SocialLinksEdit );
