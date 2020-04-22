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
import { DEFAULT_VALUES } from './utils';
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
	units,
} ) {
	const [ values, setValues ] = useState( valuesProp );
	const id = useUniqueId( idProp );
	const headingId = `${ id }-heading`;

	const updateValues = ( nextValues ) => {
		setValues( nextValues );
		onChange( nextValues );
	};

	return (
		<Root id={ id } role="region" aria-labelledby={ headingId }>
			<Header>
				<Text id={ headingId }>{ label }</Text>
			</Header>
			<LayoutContainer className="component-box-control__input-controls-wrapper">
				<InputControls
					{ ...inputProps }
					onChange={ updateValues }
					units={ units }
					values={ values }
				/>
			</LayoutContainer>
		</Root>
	);
}

BoxControl.__Visualizer = Visualizer;
