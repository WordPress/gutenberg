/**
 * Internal dependencies
 */
import BorderStyleControl from '../components/border-style-control';
import { cleanEmptyObject } from './utils';

/**
 * Inspector control for configuring border style property.
 *
 * @param  {Object} props  Block properties.
 * @return {WPElement}     Border style edit element.
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
