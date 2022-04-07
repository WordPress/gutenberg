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

const WithItemGroup = ( { isItemGroup, children } ) => {
	if ( ! isItemGroup ) {
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

const WithToolsPanelItem = ( {
	isItemGroup,
	settings,
	children,
	...props
} ) => {
	if ( isItemGroup ) {
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

const renderToggle = ( settings ) => ( { onToggle, isOpen } ) => {
	const { isItemGroup, colorValue, label } = settings;

	const ToggleComponent = isItemGroup ? Item : Button;
	const toggleClassName = isItemGroup
		? 'block-editor-panel-color-gradient-settings__item'
		: 'block-editor-panel-color-gradient-settings__dropdown';
	const toggleProps = {
		onClick: onToggle,
		className: classnames( toggleClassName, { 'is-open': isOpen } ),
		'aria-expanded': isItemGroup ? undefined : isOpen,
	};

	return (
		<ToggleComponent { ...toggleProps }>
			<LabeledColorIndicator colorValue={ colorValue } label={ label } />
		</ToggleComponent>
	);
};

export default function ColorGradientSettingsDropdown( {
	colors,
	disableCustomColors,
	disableCustomGradients,
	enableAlpha,
	gradients,
	isItemGroup = true,
	settings,
	__experimentalHasMultipleOrigins,
	__experimentalIsRenderedInSidebar,
	...props
} ) {
	const dropdownPosition = __experimentalIsRenderedInSidebar
		? 'bottom left'
		: undefined;

	const dropdownClassName = isItemGroup
		? 'block-editor-panel-color-gradient-settings__dropdown'
		: 'block-editor-tools-panel-color-gradient-settings__dropdown';

	return (
		<WithItemGroup isItemGroup={ isItemGroup }>
			{ settings.map( ( setting, index ) => {
				const controlProps = {
					clearable: isItemGroup ? undefined : false,
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
					isItemGroup,
					label: setting.label,
				};

				return (
					setting && (
						<WithToolsPanelItem
							key={ index }
							isItemGroup={ isItemGroup }
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
