/**
 * WordPress dependencies
 */
import { RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { cleanEmptyObject } from './utils';

const MIN_BORDER_WIDTH = 0;
const MAX_BORDER_WIDTH = 50;

/**
 * Inspector control for configuring border width property.
 *
 * @param  {Object} props  Block properties.
 * @return {WPElement}     Border width edit element.
 */
export const BorderWidthEdit = ( props ) => {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	const onChange = ( newWidth ) => {
		const newStyle = {
			...style,
			border: {
				...style?.border,
				width: newWidth,
			},
		};

		setAttributes( { style: cleanEmptyObject( newStyle ) } );
	};

	return (
		<RangeControl
			value={ style?.border?.width }
			label={ __( 'Border width' ) }
			min={ MIN_BORDER_WIDTH }
			max={ MAX_BORDER_WIDTH }
			initialPosition={ 0 }
			allowReset
			onChange={ onChange }
		/>
	);
};
