/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalItemGroup as ItemGroup,
} from '@wordpress/components';
import { useCallback, Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BackgroundImageControl from '../background-image-control';
import BackgroundColorControl from '../background-color-control';
import { useToolsPanelDropdownMenuProps } from './utils';
import { setImmutably } from '../../utils/object';
import { useHasBackgroundColorPanel } from './color-panel';

const DEFAULT_CONTROLS = {
	backgroundImage: true,
	backgroundColor: true,
};

/**
 * Checks site settings to see if the background image control should be available.
 *
 * @param {Object} settings Site settings
 * @return {boolean}        Whether background image control is enabled.
 */
export function useHasBackgroundImageControl( settings ) {
	return Platform.OS === 'web' && settings?.background?.backgroundImage;
}

/**
 * Checks site settings to see if the background panel may be used.
 * The panel is available if either background image or background color is enabled.
 *
 * @param {Object} settings Site settings
 * @return {boolean}        Whether site settings has activated background panel.
 */
export function useHasBackgroundPanel( settings ) {
	const hasBackgroundImage = useHasBackgroundImageControl( settings );
	const hasBackgroundColor = useHasBackgroundColorPanel( settings );
	return hasBackgroundImage || hasBackgroundColor;
}

/**
 * Checks if there is a current value in the background size block support
 * attributes. Background size values include background size as well
 * as background position.
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether the block has a background size value set.
 */
export function hasBackgroundSizeValue( style ) {
	return (
		style?.background?.backgroundPosition !== undefined ||
		style?.background?.backgroundSize !== undefined
	);
}

/**
 * Checks if there is a current value in the background image block support
 * attributes.
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether the block has a background image value set.
 */
export function hasBackgroundImageValue( style ) {
	return (
		!! style?.background?.backgroundImage?.id ||
		// Supports url() string values in theme.json.
		'string' === typeof style?.background?.backgroundImage ||
		!! style?.background?.backgroundImage?.url
	);
}

function BackgroundToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
	headerLabel,
} ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			headingLevel={ 3 }
			label={ headerLabel }
			resetAll={ resetAll }
			panelId={ panelId }
			dropdownMenuProps={ dropdownMenuProps }
		>
			{ children }
		</ToolsPanel>
	);
}

export default function BackgroundImagePanel( {
	as: Wrapper = BackgroundToolsPanel,
	value,
	onChange,
	inheritedValue,
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
	defaultValues = {},
	headerLabel = __( 'Options' ),
} ) {
	const showBackgroundImageControl = useHasBackgroundImageControl( settings );
	const showBackgroundColorControl = useHasBackgroundColorPanel( settings );

	const resetBackground = () =>
		onChange( setImmutably( value, [ 'background' ], {} ) );
	const resetBackgroundColor = () => {
		const newValue = setImmutably(
			value,
			[ 'color', 'background' ],
			undefined
		);
		newValue.color.gradient = undefined;
		onChange( newValue );
	};

	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			background: {},
			color: undefined,
		};
	}, [] );

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
			headerLabel={ headerLabel }
		>
			<ItemGroup
				className="block-editor-global-styles-background-panel__inspector-media-replace-container"
				isSeparated
				isBordered
			>
				{ showBackgroundImageControl && (
					<ToolsPanelItem
						hasValue={ () => !! value?.background }
						label={ __( 'Image' ) }
						onDeselect={ resetBackground }
						isShownByDefault={ defaultControls.backgroundImage }
						panelId={ panelId }
					>
						<BackgroundImageControl
							value={ value }
							onChange={ onChange }
							settings={ settings }
							inheritedValue={ inheritedValue }
							defaultControls={ defaultControls }
							defaultValues={ defaultValues }
						/>
					</ToolsPanelItem>
				) }
				{ showBackgroundColorControl && (
					<ToolsPanelItem
						hasValue={ () => !! value?.color }
						label={ __( 'Color' ) }
						onDeselect={ resetBackgroundColor }
						isShownByDefault={ defaultControls.backgroundColor }
						panelId={ panelId }
					>
						<BackgroundColorControl
							value={ value }
							onChange={ onChange }
							settings={ settings }
							inheritedValue={ inheritedValue }
							defaultControls={ defaultControls }
							defaultValues={ defaultValues }
						/>
					</ToolsPanelItem>
				) }
			</ItemGroup>
		</Wrapper>
	);
}
