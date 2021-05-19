/**
 * WordPress dependencies
 */
import { CustomSelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const DEFAULT_STYLE = {
	key: 'default',
	name: __( 'Default' ),
	style: { borderStyle: undefined },
};

const BORDER_STYLES = [
	DEFAULT_STYLE,
	{
		key: 'none',
		name: __( 'None' ),
		style: { borderStyle: 'none' },
	},
	{
		key: 'solid',
		name: __( 'Solid' ),
		style: { borderStyle: 'solid' },
	},
	{
		key: 'dashed',
		name: __( 'Dashed' ),
		style: { borderStyle: 'dashed' },
	},
	{
		key: 'dotted',
		name: __( 'Dotted' ),
		style: { borderStyle: 'dotted' },
	},
];

/**
 * Control to display border style options.
 *
 * @param  {Object}   props          Component props.
 * @param  {Object}   props.onChange Handler for changing border style selection.
 * @param  {Object}   props.value    Currently selected border style value.
 *
 * @return {WPElement}      Custom border style select control.
 */
export default function BorderStyleControl( { onChange, value } ) {
	const style = BORDER_STYLES.find( ( option ) => option.key === value );

	return (
		<fieldset className="components-border-style-control">
			<CustomSelectControl
				className="components-border-style-control__select"
				label={ __( 'Border style' ) }
				options={ BORDER_STYLES }
				value={ style || DEFAULT_STYLE }
				onChange={ ( { selectedItem } ) =>
					selectedItem.key === 'default'
						? onChange( undefined )
						: onChange( selectedItem.key )
				}
			/>
		</fieldset>
	);
}
