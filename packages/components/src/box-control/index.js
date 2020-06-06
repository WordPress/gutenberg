/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../button';
import { FlexItem, FlexBlock } from '../flex';
import AllInputControl from './all-input-control';
import InputControls from './input-controls';
import BoxControlIcon from './icon';
import Text from '../text';
import LinkedButton from './linked-button';
import Visualizer from './visualizer';
import {
	Root,
	Header,
	HeaderControlWrapper,
} from './styles/box-control-styles';
import { DEFAULT_VALUES, isValuesMixed } from './utils';
import { useControlledState } from '../utils/hooks';

const defaultInputProps = {
	min: 0,
};

function useUniqueId( idProp ) {
	const instanceId = useInstanceId( BoxControl, 'inspector-box-control' );

	return idProp || instanceId;
}
export default function BoxControl( {
	id: idProp,
	inputProps = defaultInputProps,
	onChange = noop,
	label = __( 'Box Control' ),
	values: valuesProp,
	units,
} ) {
	const [ values, setValues ] = useControlledState( valuesProp, {
		initial: DEFAULT_VALUES,
	} );

	const [ isDirty, setIsDirty ] = useState( false );
	const [ isLinked, setIsLinked ] = useState( ! isValuesMixed( values ) );
	const [ side, setSide ] = useState( isLinked ? 'all' : 'top' );

	const initialValuesRef = useRef( values );

	const id = useUniqueId( idProp );
	const headingId = `${ id }-heading`;

	const toggleLinked = () => {
		setIsLinked( ! isLinked );
		setSide( ! isLinked ? 'all' : 'top' );
	};

	const handleOnFocus = ( event, { side: nextSide } ) => {
		setSide( nextSide );
	};

	const handleOnChange = ( nextValues ) => {
		onChange( nextValues );
		setValues( nextValues );
		setIsDirty( true );
	};

	const handleOnReset = () => {
		const initialValues = initialValuesRef.current;

		onChange( initialValues );
		setValues( initialValues );
		setIsDirty( false );
	};

	const inputControlProps = {
		...inputProps,
		onChange: handleOnChange,
		onFocus: handleOnFocus,
		isLinked,
		units,
		values,
	};

	return (
		<Root id={ id } role="region" aria-labelledby={ headingId }>
			<Header className="component-box-control__header">
				<FlexItem>
					<Text
						id={ headingId }
						className="component-box-control__label"
					>
						{ label }
					</Text>
				</FlexItem>
				<FlexItem>
					<Button
						className="component-box-control__reset-button"
						isSecondary
						isSmall
						onClick={ handleOnReset }
						disabled={ ! isDirty }
					>
						Reset
					</Button>
				</FlexItem>
			</Header>
			<HeaderControlWrapper className="component-box-control__header-control-wrapper">
				<FlexItem>
					<BoxControlIcon side={ side } />
				</FlexItem>
				{ isLinked && (
					<FlexBlock>
						<AllInputControl { ...inputControlProps } />
					</FlexBlock>
				) }
				<FlexItem>
					<LinkedButton
						onClick={ toggleLinked }
						isLinked={ isLinked }
					/>
				</FlexItem>
			</HeaderControlWrapper>
			{ ! isLinked && <InputControls { ...inputControlProps } /> }
		</Root>
	);
}

BoxControl.__Visualizer = Visualizer;
