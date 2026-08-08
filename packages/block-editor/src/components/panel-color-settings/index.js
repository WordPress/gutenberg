import PanelColorGradientSettings from '../colors-gradients/panel-color-gradient-settings';

/**
 * `PanelColorSettings` is a React component that renders a UI for managing various color settings.
 * It is essentially a wrapper around the `PanelColorGradientSettings` component, but specifically
 * disables the gradient features.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/panel-color-settings/README.md
 *
 * @example
 * ```jsx
 * import { useState } from 'react';
 * import { PanelColorSettings } from '@wordpress/block-editor';
 * import { __ } from '@wordpress/i18n';
 *
 * const MyPanelColorSettings = () => {
 *   const [textColor, setTextColor] = useState({ color: '#000' });
 *   const [backgroundColor, setBackgroundColor] = useState({
 *     color: '#fff',
 *   });
 *   const [overlayTextColor, setOverlayTextColor] = useState({
 *     color: '#000',
 *   });
 *   const [overlayBackgroundColor, setOverlayBackgroundColor] = useState({
 *     color: '#eee',
 *   });
 *
 *   return (
 *     <PanelColorSettings
 *       __experimentalIsRenderedInSidebar
 *       title={__('Color')}
 *       colorSettings={[
 *         {
 *           value: textColor.color,
 *           onChange: setTextColor,
 *           label: __('Text'),
 *         },
 *         {
 *           value: backgroundColor.color,
 *           onChange: setBackgroundColor,
 *           label: __('Background'),
 *         },
 *         {
 *           value: overlayTextColor.color,
 *           onChange: setOverlayTextColor,
 *           label: __('Submenu & overlay text'),
 *         },
 *         {
 *           value: overlayBackgroundColor.color,
 *           onChange: setOverlayBackgroundColor,
 *           label: __('Submenu & overlay background'),
 *         },
 *       ]}
 *     />
 *   );
 * };
 *
 * <MyPanelColorSettings />;
 * ```
 *
 * @param {Object}      props                                     Component props.
 * @param {Array}       [props.colorSettings]                     A user-provided array of color settings. Colors settings are provided as an array of objects with the following schema:
 *                                                                - `value` (string): The current color of the setting.
 *                                                                - `onChange` (Function): Callback on change of the setting.
 *                                                                - `label` (string): Label of the setting.
 * @param {string}      [props.className]                         Additional class names added to the underlying `ToolsPanel` instance.
 * @param {Array}       [props.colors]                            An array of predefined colors to be displayed in the color palette.
 * @param {boolean}     [props.disableCustomColors]               Whether to disable the option for users to add custom colors.
 * @param {JSX.Element} [props.children]                          Displayed below the underlying `PanelColorGradientSettings` instance.
 * @param {string}      [props.title]                             The title of the underlying `ToolsPanel`.
 * @param {boolean}     [props.showTitle]                         Whether to show the title of the `ToolsPanel`.
 * @param {boolean}     [props.__experimentalIsRenderedInSidebar] Whether this is rendered in the sidebar.
 * @param {boolean}     [props.enableAlpha]                       Whether to enable the alpha (opacity) slider in the color picker.
 * @return {JSX.Element} The PanelColorSettings component.
 */
const PanelColorSettings = ( { colorSettings, ...props } ) => {
	const settings = colorSettings.map( ( setting ) => {
		if ( ! setting ) {
			return setting;
		}
		const { value, onChange, ...otherSettings } = setting;
		return {
			...otherSettings,
			colorValue: value,
			onColorChange: onChange,
		};
	} );
	return (
		<PanelColorGradientSettings
			settings={ settings }
			gradients={ [] }
			disableCustomGradients
			{ ...props }
		/>
	);
};
export default PanelColorSettings;
