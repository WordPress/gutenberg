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
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import ColorGradientControl from './control';
import useMultipleOriginColorsAndGradients from './use-multiple-origin-colors-and-gradients';

export default function ToolsPanelColorDropdown( {
	settings,
	enableAlpha,
	...otherProps
} ) {
	const colorGradientSettings = useMultipleOriginColorsAndGradients();
	const controlSettings = {
		...colorGradientSettings,
		clearable: false,
		enableAlpha,
		label: settings.label,
		onColorChange: settings.onColorChange,
		onGradientChange: settings.onGradientChange,
		colorValue: settings.colorValue,
		gradientValue: settings.gradientValue,
	};
	const selectedColor = settings.gradientValue ?? settings.colorValue;

	return (
		<ToolsPanelItem
			hasValue={ settings.hasValue }
			label={ settings.label }
			onDeselect={ settings.onDeselect }
			isShownByDefault={ settings.isShownByDefault }
			resetAllFilter={ settings.resetAllFilter }
			{ ...otherProps }
			className="block-editor-tools-panel-color-gradient-settings__item"
		>
			<Dropdown
				className="block-editor-tools-panel-color-dropdown"
				contentClassName="block-editor-panel-color-gradient-settings__dropdown-content"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						onClick={ onToggle }
						aria-expanded={ isOpen }
						className={ classnames(
							'block-editor-panel-color-gradient-settings__dropdown',
							{ 'is-open': isOpen }
						) }
					>
						<HStack justify="flex-start">
							<ColorIndicator
								className="block-editor-panel-color-gradient-settings__color-indicator"
								colorValue={ selectedColor }
							/>
							<FlexItem>{ settings.label }</FlexItem>
						</HStack>
					</Button>
				) }
				renderContent={ () => (
					<ColorGradientControl
						showTitle={ false }
						__experimentalHasMultipleOrigins
						__experimentalIsRenderedInSidebar
						enableAlpha
						{ ...controlSettings }
					/>
				) }
			/>
		</ToolsPanelItem>
	);
}
