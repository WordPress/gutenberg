/**
 * Internal dependencies
 */
import BorderRadiusControl from '../components/border-radius-control';
import { cleanEmptyObject } from './utils';
import { removeBorderAttribute } from './border';

/**
 * Inspector control panel containing the border radius related configuration.
 *
 * @param {Object} props Block properties.
 *
 * @return {WPElement} Border radius edit element.
 */
export function BorderRadiusEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	const onChange = ( newRadius ) => {
		let newStyle = {
			...style,
			border: {
				...style?.border,
				radius: newRadius,
			},
		};

		if ( newRadius === undefined || newRadius === '' ) {
			newStyle = cleanEmptyObject( newStyle );
		}

		setAttributes( { style: newStyle } );
	};

	return (
		<BorderRadiusControl
			values={ style?.border?.radius }
			onChange={ onChange }
		/>
	);
}

/**
 * Checks if there is a current value in the border radius block support
 * attributes.
 *
 * @param {Object} props Block props.
 * @return {boolean}     Whether or not the block has a border radius value set.
 */
export function hasBorderRadiusValue( props ) {
	const borderRadius = props.attributes.style?.border?.radius;

	if ( typeof borderRadius === 'object' ) {
		return Object.entries( borderRadius ).some( Boolean );
	}

	return !! borderRadius;
}

/**
 * Resets the border radius block support attributes. This can be used when
 * disabling the border radius support controls for a block via a progressive
 * discovery panel.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetBorderRadius( { attributes = {}, setAttributes } ) {
	const { style } = attributes;
	setAttributes( { style: removeBorderAttribute( style, 'radius' ) } );
}
