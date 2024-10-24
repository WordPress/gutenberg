/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import {
	useInnerBlocksProps,
	useBlockProps,
	InspectorControls,
	ContrastChecker,
	withColors,
	InnerBlocks,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

const sizeOptions = [
	{ label: __( 'Small' ), value: 'has-small-icon-size' },
	{ label: __( 'Normal' ), value: 'has-normal-icon-size' },
	{ label: __( 'Large' ), value: 'has-large-icon-size' },
	{ label: __( 'Huge' ), value: 'has-huge-icon-size' },
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

	const hasSelectedChild = useSelect(
		( select ) =>
			select( blockEditorStore ).hasSelectedInnerBlock( clientId ),
		[ clientId ]
	);

	const hasAnySelected = isSelected || hasSelectedChild;

	const logosOnly = attributes.className?.includes( 'is-style-logos-only' );

	// Remove icon background color when logos only style is selected or
	// restore it when any other style is selected.
	const backgroundBackupRef = useRef( {} );
	useEffect( () => {
		if ( logosOnly ) {
			backgroundBackupRef.current = {
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
			setAttributes( { ...backgroundBackupRef.current } );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
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

	// Fallback color values are used maintain selections in case switching
	// themes and named colors in palette do not match.
	const className = clsx( size, {
		'has-visible-labels': showLabels,
		'has-icon-color': iconColor.color || iconColorValue,
		'has-icon-background-color':
			iconBackgroundColor.color || iconBackgroundColorValue,
	} );

	const blockProps = useBlockProps( { className } );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		placeholder: ! isSelected && SocialPlaceholder,
		templateLock: false,
		orientation: attributes.layout?.orientation ?? 'horizontal',
		__experimentalAppenderTagName: 'li',
		renderAppender: hasAnySelected && InnerBlocks.ButtonBlockAppender,
	} );

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
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						help={ __( 'Choose the size of the Social Icons.' ) }
						label={ __( 'Size' ) }
						onChange={ ( entry ) => {
							setAttributes( {
								size: entry,
							} );
						} }
						value={ size ?? 'has-normal-icon-size' }
						options={ sizeOptions }
					/>
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
						label={ __( 'Show text' ) }
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
