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
import { Flex } from '../flex';
import InputControls from './input-controls';
import Text from '../text';
import LinkedButton from './linked-button';
import Visualizer from './visualizer';
import { useBoxControlState } from './utils';
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
	values: valuesProp,
	units,
} ) {
	const [ values, setValues ] = useBoxControlState( valuesProp );
	const [ isLinked, setIsLinked ] = useState( true );
	const id = useUniqueId( idProp );
	const headingId = `${ id }-heading`;

	const updateValues = ( nextValues ) => {
		setValues( nextValues );
		onChange( nextValues );
	};

	const toggleLinked = () => setIsLinked( ! isLinked );

	return (
		<Root id={ id } role="region" aria-labelledby={ headingId }>
			<Header className="component-box-control__header">
				<Flex.Item>
					<Text
						id={ headingId }
						className="component-box-control__label"
					>
						{ label }
					</Text>
				</Flex.Item>
				<Flex.Item>
					<LinkedButton
						onClick={ toggleLinked }
						isLinked={ isLinked }
					/>
				</Flex.Item>
			</Header>
			<LayoutContainer className="component-box-control__input-controls-wrapper">
				<InputControls
					{ ...inputProps }
					onChange={ updateValues }
					isLinked={ isLinked }
					units={ units }
					values={ values }
				/>
			</LayoutContainer>
		</Root>
	);
}

BoxControl.__Visualizer = Visualizer;
