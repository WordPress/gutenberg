/**
 * WordPress dependencies
 */
import { RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const MIN_BORDER_RADIUS_VALUE = 0;
const MAX_BORDER_RADIUS_VALUE = 50;

/**
 * Inspector control panel containing the border radius related configuration.
 *
 * @param  {Object} props Block properties.
 * @return {WPElement}    Border radius edit element.
 */
export function BorderRadiusEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	const onChange = ( newRadius ) => {
		setAttributes( {
			style: {
				...style,
				border: {
					...style?.border,
					radius: newRadius,
				},
			},
		} );
	};

	return (
		<RangeControl
			value={ style?.border?.radius }
			label={ __( 'Border radius' ) }
			min={ MIN_BORDER_RADIUS_VALUE }
			max={ MAX_BORDER_RADIUS_VALUE }
			initialPosition=""
			allowReset
			onChange={ onChange }
		/>
	);
}
