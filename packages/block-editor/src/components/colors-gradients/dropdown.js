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
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	__experimentalHStack as HStack,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import ColorGradientControl from './control';

// When the `ColorGradientSettingsDropdown` controls are being rendered to a
// `ToolsPanel` they must be wrapped in a `ToolsPanelItem`.
const WithToolsPanelItem = ( { setting, children, panelId, ...props } ) => {
	const clearValue = () => {
		if ( setting.colorValue ) {
			setting.onColorChange();
		} else if ( setting.gradientValue ) {
			setting.onGradientChange();
		}
	};
	return (
		<ToolsPanelItem
			hasValue={ () => {
				return !! setting.colorValue || !! setting.gradientValue;
			} }
			label={ setting.label }
			onDeselect={ clearValue }
			isShownByDefault={
				setting.isShownByDefault !== undefined
					? setting.isShownByDefault
					: true
			}
			{ ...props }
			className="block-editor-tools-panel-color-gradient-settings__item"
			panelId={ panelId }
			// Pass resetAllFilter if supplied due to rendering via SlotFill
			// into parent ToolsPanel.
			resetAllFilter={ setting.resetAllFilter }
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
		<FlexItem
			className="block-editor-panel-color-gradient-settings__color-name"
			title={ label }
		>
			{ label }
		</FlexItem>
	</HStack>
);

// Renders a color dropdown's toggle as an `Item` if it is within an `ItemGroup`
// or as a `Button` if it isn't e.g. the controls are being rendered in
// a `ToolsPanel`.
const renderToggle =
	( settings ) =>
	( { onToggle, isOpen } ) => {
		const { colorValue, label } = settings;

		const toggleProps = {
			onClick: onToggle,
			className: classnames(
				'block-editor-panel-color-gradient-settings__dropdown',
				{ 'is-open': isOpen }
			),
			'aria-expanded': isOpen,
		};

		return (
			<Button { ...toggleProps }>
				<LabeledColorIndicator
					colorValue={ colorValue }
					label={ label }
				/>
			</Button>
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
	settings,
	__experimentalIsRenderedInSidebar,
	...props
} ) {
	let popoverProps;
	if ( __experimentalIsRenderedInSidebar ) {
		popoverProps = {
			placement: 'left-start',
			offset: 36,
			shift: true,
		};
	}

	return (
		<>
			{ settings.map( ( setting, index ) => {
				const controlProps = {
					clearable: false,
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
					__experimentalIsRenderedInSidebar,
					...setting,
				};
				const toggleSettings = {
					colorValue: setting.gradientValue ?? setting.colorValue,
					label: setting.label,
				};

				return (
					setting && (
						// If not in an `ItemGroup` wrap the dropdown in a
						// `ToolsPanelItem`
						<WithToolsPanelItem
							key={ index }
							setting={ setting }
							{ ...props }
						>
							<Dropdown
								popoverProps={ popoverProps }
								className="block-editor-tools-panel-color-gradient-settings__dropdown"
								renderToggle={ renderToggle( toggleSettings ) }
								renderContent={ () => (
									<DropdownContentWrapper paddingSize="none">
										<div className="block-editor-panel-color-gradient-settings__dropdown-content">
											<ColorGradientControl
												{ ...controlProps }
											/>
										</div>
									</DropdownContentWrapper>
								) }
							/>
						</WithToolsPanelItem>
					)
				);
			} ) }
		</>
	);
}
