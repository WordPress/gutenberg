import {
	SelectControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

/**
 * @typedef {import('@wordpress/components/build-types/select-control/types').SelectControlProps} SelectControlProps
 */

/**
 * These should use the same values as AspectRatioDropdown in @wordpress/block-editor.
 * @type {SelectControlProps[]}
 */
export const DEFAULT_ASPECT_RATIO_OPTIONS = [
	{
		label: __( 'Original' ),
		value: 'auto',
	},
	{
		label: __( 'Square - 1:1' ),
		value: '1',
	},
	{
		label: __( 'Standard - 4:3' ),
		value: '4/3',
	},
	{
		label: __( 'Portrait - 3:4' ),
		value: '3/4',
	},
	{
		label: __( 'Classic - 3:2' ),
		value: '3/2',
	},
	{
		label: __( 'Classic Portrait - 2:3' ),
		value: '2/3',
	},
	{
		label: __( 'Wide - 16:9' ),
		value: '16/9',
	},
	{
		label: __( 'Tall - 9:16' ),
		value: '9/16',
	},
	{
		label: __( 'Custom' ),
		value: 'custom',
		disabled: true,
		hidden: true,
	},
];

/**
 * @callback AspectRatioToolProps~onChange
 * @param {string} [value]
 * @returns {void}
 */

/**
 * @typedef {Object} AspectRatioToolProps
 * @property {string}                        [panelId]
 * @property {string}                        [value]
 * @property {AspectRatioToolProps~onChange} [onChange]
 * @property {SelectControlProps[]}          [options]
 * @property {string}                        [defaultValue]
 * @property {boolean}                       [isShownByDefault]
 */

export default function AspectRatioTool( {
	panelId,
	value,
	onChange = () => {},
	options = DEFAULT_ASPECT_RATIO_OPTIONS,
	defaultValue = DEFAULT_ASPECT_RATIO_OPTIONS[ 0 ].value,
	isShownByDefault = true,
} ) {
	return (
		<ToolsPanelItem
			hasValue={ () => value != null && value !== defaultValue }
			label={ __( 'Aspect ratio' ) }
			onDeselect={ () => onChange( undefined ) }
			isShownByDefault={ isShownByDefault }
			panelId={ panelId }
		>
			<SelectControl
				label={ __( 'Aspect ratio' ) }
				value={ value ?? defaultValue }
				options={ options }
				onChange={ onChange }
			/>
		</ToolsPanelItem>
	);
}
