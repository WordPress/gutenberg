/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
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
import {
	ToggleControl,
	SelectControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const sizeOptions = [
	{ label: __( 'Default' ), value: '' },
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
		iconColorValue,
		openInNewTab,
		showLabels,
		size,
	} = attributes;

	const { hasSocialIcons, hasSelectedChild } = useSelect(
		( select ) => {
			const { getBlockCount, hasSelectedInnerBlock } =
				select( blockEditorStore );
			return {
				hasSocialIcons: getBlockCount( clientId ) > 0,
				hasSelectedChild: hasSelectedInnerBlock( clientId ),
			};
		},
		[ clientId ]
	);

	const hasAnySelected = isSelected || hasSelectedChild;

	const logosOnly = attributes.className?.includes( 'is-style-logos-only' );

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	// Remove icon background color when logos only style is selected or
	// restore it when any other style is selected.
	useEffect( () => {
		if ( logosOnly ) {
			let restore;
			setAttributes( ( prev ) => {
				restore = {
					iconBackgroundColor: prev.iconBackgroundColor,
					iconBackgroundColorValue: prev.iconBackgroundColorValue,
					customIconBackgroundColor: prev.customIconBackgroundColor,
				};
				return {
					iconBackgroundColor: undefined,
					iconBackgroundColorValue: undefined,
					customIconBackgroundColor: undefined,
				};
			} );

			return () => setAttributes( { ...restore } );
		}
	}, [ logosOnly, setAttributes ] );

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
		templateLock: false,
		orientation: attributes.layout?.orientation ?? 'horizontal',
		__experimentalAppenderTagName: 'li',
		renderAppender:
			! hasSocialIcons || hasAnySelected
				? InnerBlocks.ButtonBlockAppender
				: undefined,
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
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							openInNewTab: false,
							showLabels: false,
							size: undefined,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						isShownByDefault
						hasValue={ () => !! size }
						label={ __( 'Icon size' ) }
						onDeselect={ () =>
							setAttributes( { size: undefined } )
						}
					>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Icon size' ) }
							onChange={ ( newSize ) => {
								setAttributes( {
									size: newSize === '' ? undefined : newSize,
								} );
							} }
							value={ size ?? '' }
							options={ sizeOptions }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						isShownByDefault
						label={ __( 'Show text' ) }
						hasValue={ () => !! showLabels }
						onDeselect={ () =>
							setAttributes( { showLabels: false } )
						}
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Show text' ) }
							checked={ showLabels }
							onChange={ () =>
								setAttributes( { showLabels: ! showLabels } )
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						isShownByDefault
						label={ __( 'Open links in new tab' ) }
						hasValue={ () => !! openInNewTab }
						onDeselect={ () =>
							setAttributes( { openInNewTab: false } )
						}
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Open links in new tab' ) }
							checked={ openInNewTab }
							onChange={ () =>
								setAttributes( {
									openInNewTab: ! openInNewTab,
								} )
							}
						/>
					</ToolsPanelItem>
				</ToolsPanel>
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
										clearable: true,
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
