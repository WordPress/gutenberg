/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { useSettings } from '../use-settings';
import { InheritanceToolsPanelItem } from '../global-styles/inheritance';

/**
 * @typedef {import('@wordpress/components/build-types/select-control/types').SelectControlProps} SelectControlProps
 */

/**
 * @callback AspectRatioToolPropsOnChange
 * @param {string} [value] New aspect ratio value.
 * @return {void} No return.
 */

/**
 * @typedef {Object} AspectRatioToolProps
 * @property {string}                       [panelId]          ID of the panel this tool is associated with.
 * @property {string}                       [value]            Current aspect ratio value.
 * @property {AspectRatioToolPropsOnChange} [onChange]         Callback to update the aspect ratio value.
 * @property {SelectControlProps[]}         [options]          Aspect ratio options.
 * @property {string}                       [defaultValue]     Default aspect ratio value.
 * @property {boolean}                      [isShownByDefault] Whether the tool is shown by default.
 * @property {string}                       [className]        Additional CSS class on the wrapping panel item.
 * @property {boolean}                      [isInherited]      Whether the control is displaying an inherited Global Styles value.
 * @property {boolean}                      [hasLocalOverride] Whether a local value is overriding an inherited Global Styles value.
 */

export default function AspectRatioTool( {
	panelId,
	value,
	onChange = () => {},
	options,
	defaultValue = 'auto',
	hasValue,
	isShownByDefault = true,
	className,
	isInherited,
	hasLocalOverride,
} ) {
	// Match the CSS default so if the value is used directly in CSS it will look correct in the control.
	const displayValue = value ?? 'auto';

	const [ defaultRatios, themeRatios, showDefaultRatios ] = useSettings(
		'dimensions.aspectRatios.default',
		'dimensions.aspectRatios.theme',
		'dimensions.defaultAspectRatios'
	);

	const themeOptions = themeRatios?.map( ( { name, ratio } ) => ( {
		label: name,
		value: ratio,
	} ) );

	const defaultOptions = defaultRatios?.map( ( { name, ratio } ) => ( {
		label: name,
		value: ratio,
	} ) );

	const aspectRatioOptions = [
		{
			label: _x(
				'Original',
				'Aspect ratio option for dimensions control'
			),
			value: 'auto',
		},
		...( showDefaultRatios ? defaultOptions : [] ),
		...( themeOptions ? themeOptions : [] ),
		{
			label: _x( 'Custom', 'Aspect ratio option for dimensions control' ),
			value: 'custom',
			disabled: true,
			hidden: true,
		},
	];

	return (
		<InheritanceToolsPanelItem
			className={ className }
			isInherited={ isInherited }
			hasLocalOverride={ hasLocalOverride }
			hasValue={
				hasValue ? hasValue : () => displayValue !== defaultValue
			}
			label={ __( 'Aspect ratio' ) }
			onDeselect={ () => onChange( undefined ) }
			isShownByDefault={ isShownByDefault }
			panelId={ panelId }
		>
			<SelectControl
				label={ __( 'Aspect ratio' ) }
				value={ displayValue }
				options={ options ?? aspectRatioOptions }
				onChange={ onChange }
			/>
		</InheritanceToolsPanelItem>
	);
}
