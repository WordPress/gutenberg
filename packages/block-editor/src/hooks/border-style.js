/**
 * Internal dependencies
 */
import BorderStyleControl from '../components/border-style-control';
import { cleanEmptyObject } from './utils';
import { removeBorderAttribute } from './border';

/**
 * Inspector control for configuring border style property.
 *
 * @param {Object} props Block properties.
 *
 * @return {WPElement} Border style edit element.
 */
export const BorderStyleEdit = ( props ) => {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	const onChange = ( newBorderStyle ) => {
		const newStyleAttributes = {
			...style,
			border: {
				...style?.border,
				style: newBorderStyle,
			},
		};

		setAttributes( { style: cleanEmptyObject( newStyleAttributes ) } );
	};

	return (
		<BorderStyleControl
			value={ style?.border?.style }
			onChange={ onChange }
		/>
	);
};

/**
 * Checks if there is a current value in the border style block support
 * attributes.
 *
 * @param {Object} props Block props.
 * @return {boolean}     Whether or not the block has a border style value set.
 */
export function hasBorderStyleValue( props ) {
	return !! props.attributes.style?.border?.style;
}

/**
 * Resets the border style block support attribute. This can be used when
 * disabling the border style support control for a block via a progressive
 * discovery panel.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetBorderStyle( { attributes = {}, setAttributes } ) {
	const { style } = attributes;
	setAttributes( { style: removeBorderAttribute( style, 'style' ) } );
}
