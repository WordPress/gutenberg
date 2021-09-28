/**
 * Internal dependencies
 */
import BorderRadiusControl from '../components/border-radius-control';
import { cleanEmptyObject } from './utils';

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
