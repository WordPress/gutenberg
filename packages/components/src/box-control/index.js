/**
 * External dependencies
 */
import { noop } from 'lodash';
/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import Visualizer from './visualizer';
import InputControls from './input-controls';
import Text from '../text';
import { DEFAULT_VALUES, parseValues } from './utils';
import { Root, Header, LayoutContainer } from './styles/box-control-styles';

const defaultInputProps = {
	min: 0,
};

function useUniqueId( idProp ) {
	const instanceId = useInstanceId( BoxControl );
	const id = `inspector-box-control-${ instanceId }`;

	return idProp || id;
}
export default function BoxControl( {
	idProp,
	inputProps = defaultInputProps,
	onChange = noop,
	label = __( 'Box Control' ),
	values: valuesProp = DEFAULT_VALUES,
	// Disable units for now
	units = false,
} ) {
	const [ values, setValues ] = useState( parseValues( valuesProp ) );
	const id = useUniqueId( idProp );
	const headingId = `${ id }-heading`;

	const updateValues = ( nextValues ) => {
		const mergedValues = { ...values, ...nextValues };
		setValues( mergedValues );
		onChange( mergedValues );
	};

	return (
		<Root id={ id } role="region" aria-labelledby={ headingId }>
			<Header>
				<Text id={ headingId }>{ label }</Text>
			</Header>
			<LayoutContainer>
				<InputControls
					{ ...inputProps }
					values={ values }
					onChange={ updateValues }
					units={ units }
				/>
			</LayoutContainer>
		</Root>
	);
}

BoxControl.__Visualizer = Visualizer;
