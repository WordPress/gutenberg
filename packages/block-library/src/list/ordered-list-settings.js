/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import {
	TextControl,
	PanelBody,
	ToggleControl,
	SelectControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { Platform } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const LIST_STYLE_OPTIONS = [
	{
		label: __( 'Numbers' ),
		value: 'decimal',
	},
	{
		label: __( 'Uppercase letters' ),
		value: 'upper-alpha',
	},
	{
		label: __( 'Lowercase letters' ),
		value: 'lower-alpha',
	},
	{
		label: __( 'Uppercase Roman numerals' ),
		value: 'upper-roman',
	},
	{
		label: __( 'Lowercase Roman numerals' ),
		value: 'lower-roman',
	},
];

const OrderedListSettings = ( { setAttributes, reversed, start, type } ) => {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<InspectorControls>
			{ Platform.isNative ? (
				<PanelBody title={ __( 'Settings' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'List style' ) }
						options={ LIST_STYLE_OPTIONS }
						value={ type }
						onChange={ ( newValue ) =>
							setAttributes( { type: newValue } )
						}
					/>
					<TextControl
						__next40pxDefaultSize
						label={ __( 'Start value' ) }
						type="number"
						onChange={ ( value ) => {
							const int = parseInt( value, 10 );

							setAttributes( {
								// It should be possible to unset the value,
								// e.g. with an empty string.
								start: isNaN( int ) ? undefined : int,
							} );
						} }
						value={
							Number.isInteger( start )
								? start.toString( 10 )
								: ''
						}
						step="1"
					/>
					<ToggleControl
						label={ __( 'Reverse order' ) }
						checked={ reversed || false }
						onChange={ ( value ) => {
							setAttributes( {
								// Unset the attribute if not reversed.
								reversed: value || undefined,
							} );
						} }
					/>
				</PanelBody>
			) : (
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							type: undefined,
							start: undefined,
							reversed: undefined,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'List style' ) }
						isShownByDefault
						hasValue={ () => !! type }
						onDeselect={ () =>
							setAttributes( {
								type: undefined,
							} )
						}
					>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'List style' ) }
							options={ LIST_STYLE_OPTIONS }
							value={ type || 'decimal' }
							onChange={ ( newValue ) =>
								setAttributes( { type: newValue } )
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Start value' ) }
						isShownByDefault
						hasValue={ () => !! start }
						onDeselect={ () =>
							setAttributes( {
								start: undefined,
							} )
						}
					>
						<TextControl
							__next40pxDefaultSize
							label={ __( 'Start value' ) }
							type="number"
							onChange={ ( value ) => {
								const int = parseInt( value, 10 );

								setAttributes( {
									// It should be possible to unset the value,
									// e.g. with an empty string.
									start: isNaN( int ) ? undefined : int,
								} );
							} }
							value={
								Number.isInteger( start )
									? start.toString( 10 )
									: ''
							}
							step="1"
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Reverse order' ) }
						isShownByDefault
						hasValue={ () => !! reversed }
						onDeselect={ () =>
							setAttributes( {
								reversed: undefined,
							} )
						}
					>
						<ToggleControl
							label={ __( 'Reverse order' ) }
							checked={ reversed || false }
							onChange={ ( value ) => {
								setAttributes( {
									// Unset the attribute if not reversed.
									reversed: value || undefined,
								} );
							} }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			) }
		</InspectorControls>
	);
};

export default OrderedListSettings;
