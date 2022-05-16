/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Button,
	ColorIndicator,
	Dropdown,
	FlexItem,
	__experimentalHStack as HStack,
	__experimentalItem as Item,
	__experimentalItemGroup as ItemGroup,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import ColorGradientControl from './control';

// Conditionally wraps the `ColorGradientSettingsDropdown` color controls in an
// `ItemGroup` allowing for a standalone group of controls to be
// rendered semantically.
const WithItemGroup = ( { __experimentalIsItemGroup, children } ) => {
	if ( ! __experimentalIsItemGroup ) {
		return children;
	}

	return (
		<ItemGroup
			isBordered
			isSeparated
			className="block-editor-panel-color-gradient-settings__item-group"
		>
			{ children }
		</ItemGroup>
	);
};

// When the `ColorGradientSettingsDropdown` controls are being rendered to a
// `ToolsPanel` they must be wrapped in a `ToolsPanelItem`.
const WithToolsPanelItem = ( {
	__experimentalIsItemGroup,
	settings,
	children,
	...props
} ) => {
	if ( __experimentalIsItemGroup ) {
		return children;
	}

	return (
		<ToolsPanelItem
			hasValue={ settings.hasValue }
			label={ settings.label }
			onDeselect={ settings.onDeselect }
			isShownByDefault={ settings.isShownByDefault }
			resetAllFilter={ settings.resetAllFilter }
			{ ...props }
			className="block-editor-tools-panel-color-gradient-settings__item"
		>
			{ children }
		</ToolsPanelItem>
	);
};

const LabeledColorIndicator = ( { colorValue, label } ) => (
	<HStack justify="flex-start">
		<ColorIndicator
			className="block-editor-panel-color-gradient-settings__color-indicator"
			colorValue={ colorValue }
		/>
		<FlexItem>{ label }</FlexItem>
	</HStack>
);

// Renders a color dropdown's toggle as an `Item` if it is within an `ItemGroup`
// or as a `Button` if it isn't e.g. the controls are being rendered in
// a `ToolsPanel`.
const renderToggle = ( settings ) => ( { onToggle, isOpen } ) => {
	const { __experimentalIsItemGroup, colorValue, label } = settings;

	// Determine component, `Item` or `Button`, to wrap color indicator with.
	const ToggleComponent = __experimentalIsItemGroup ? Item : Button;
	const toggleClassName = __experimentalIsItemGroup
		? 'block-editor-panel-color-gradient-settings__item'
		: 'block-editor-panel-color-gradient-settings__dropdown';
	const toggleProps = {
		onClick: onToggle,
		className: classnames( toggleClassName, { 'is-open': isOpen } ),
		'aria-expanded': __experimentalIsItemGroup ? undefined : isOpen,
	};

	return (
		<ToggleComponent { ...toggleProps }>
			<LabeledColorIndicator colorValue={ colorValue } label={ label } />
		</ToggleComponent>
	);
};

// Renders a collection of color controls as dropdowns. Depending upon the
// context in which these dropdowns are being rendered, they may be wrapped
// in an `ItemGroup` with each dropdown's toggle as an `Item`, or alternatively,
// the may be individually wrapped in a `ToolsPanelItem` with the toggle as
// a regular `Button`.
//
// For more context see: https://github.com/WordPress/gutenberg/pull/40084
export default function ColorGradientSettingsDropdown( {
	colors,
	disableCustomColors,
	disableCustomGradients,
	enableAlpha,
	gradients,
	__experimentalIsItemGroup = true,
	settings,
	__experimentalHasMultipleOrigins,
	__experimentalIsRenderedInSidebar,
	...props
} ) {
	const dropdownPosition = __experimentalIsRenderedInSidebar
		? 'bottom left'
		: undefined;

	const dropdownClassName = __experimentalIsItemGroup
		? 'block-editor-panel-color-gradient-settings__dropdown'
		: 'block-editor-tools-panel-color-gradient-settings__dropdown';

	return (
		// Only wrap with `ItemGroup` if these controls are being rendered
		// semantically.
		<WithItemGroup __experimentalIsItemGroup={ __experimentalIsItemGroup }>
			{ settings.map( ( setting, index ) => {
				const controlProps = {
					clearable: __experimentalIsItemGroup ? undefined : false,
					colorValue: setting.colorValue,
					colors,
					disableCustomColors,
					disableCustomGradients,
					enableAlpha,
					gradientValue: setting.gradientValue,
					gradients,
					label: setting.label,
					onColorChange: setting.onColorChange,
					onGradientChange: setting.onGradientChange,
					showTitle: false,
					__experimentalHasMultipleOrigins,
					__experimentalIsRenderedInSidebar,
					...setting,
				};
				const toggleSettings = {
					colorValue: setting.gradientValue ?? setting.colorValue,
					__experimentalIsItemGroup,
					label: setting.label,
				};

				return (
					setting && (
						// If not in an `ItemGroup` wrap the dropdown in a
						// `ToolsPanelItem`
						<WithToolsPanelItem
							key={ index }
							__experimentalIsItemGroup={
								__experimentalIsItemGroup
							}
							settings={ setting }
							{ ...props }
						>
							<Dropdown
								position={ dropdownPosition }
								className={ dropdownClassName }
								contentClassName="block-editor-panel-color-gradient-settings__dropdown-content"
								renderToggle={ renderToggle( toggleSettings ) }
								renderContent={ () => (
									<ColorGradientControl { ...controlProps } />
								) }
							/>
						</WithToolsPanelItem>
					)
				);
			} ) }
		</WithItemGroup>
	);
}
