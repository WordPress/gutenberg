/**
 * External dependencies
 */
import { noop } from 'lodash';
/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import Visualizer from './visualizer';
import { FlexItem } from '../flex';
import InputControls from './input-controls';
import { DEFAULT_VALUES, parseValues } from './utils';
import { Root, Header, LayoutContainer } from './styles/box-control-styles';

const defaultInputProps = {
	min: 0,
};

export default function BoxControl( {
	inputProps = defaultInputProps,
	onChange = noop,
	label = __( 'Box Control' ),
	values: valuesProp = DEFAULT_VALUES,
	// Disable units for now
	units = false,
} ) {
	const [ values, setValues ] = useState( parseValues( valuesProp ) );

	const updateValues = ( nextValues ) => {
		const mergedValues = { ...values, ...nextValues };
		setValues( mergedValues );
		onChange( mergedValues );
	};

	return (
		<Root>
			<Header>
				<FlexItem>{ label }</FlexItem>
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
