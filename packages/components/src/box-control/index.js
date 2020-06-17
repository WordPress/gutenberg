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
import Button from '../button';
import CustomSelectControl from '../custom-select-control';
import { FlexItem } from '../flex';
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
import {
	DEFAULT_VALUES,
	DEFAULT_VISUALIZER_VALUES,
	isValuesMixed,
	isValuesDefined,
} from './utils';
import { useControlledState } from '../utils/hooks';

const defaultInputProps = {
	min: 0,
};

function useUniqueId( idProp ) {
	const instanceId = useInstanceId( BoxControl );
	const id = `inspector-box-control-${ instanceId }`;

	return idProp || id;
}

const DEFAULT_OPTION = {
	key: 'default',
	name: __( 'Default' ),
	value: undefined,
};

const CUSTOM_OPTION = {
	key: 'custom',
	name: __( 'Custom' ),
	value: 'custom',
};

export default function BoxControl( {
	id: idProp,
	inputProps = defaultInputProps,
	onChange = noop,
	onChangeShowVisualizer = noop,
	label = __( 'Box Control' ),
	values: valuesProp,
	units,
	presetValues,
} ) {
	const [ values, setValues ] = useControlledState( valuesProp );
	const inputValues = values || DEFAULT_VALUES;
	const hasInitialValue = isValuesDefined( valuesProp );

	const [ isDirty, setIsDirty ] = useState( hasInitialValue );
	const [ isLinked, setIsLinked ] = useState(
		! hasInitialValue || ! isValuesMixed( inputValues )
	);

	const [ side, setSide ] = useState( isLinked ? 'all' : 'top' );

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

	const handleOnHoverOn = ( next = {} ) => {
		onChangeShowVisualizer( { ...DEFAULT_VISUALIZER_VALUES, ...next } );
	};

	const handleOnHoverOff = ( next = {} ) => {
		onChangeShowVisualizer( { ...DEFAULT_VISUALIZER_VALUES, ...next } );
	};

	const handleOnReset = () => {
		const initialValues = DEFAULT_VALUES;

		onChange( initialValues );
		setValues( initialValues );
		setIsDirty( false );
	};

	const handleOnChangePresets = ( { selectedItem: { value } } ) => {
		const nextValues = {
			top: value,
			right: value,
			bottom: value,
			left: value,
		};
		onChange( nextValues );
		setValues( nextValues );
		setIsDirty( true );
	};

	const inputControlProps = {
		...inputProps,
		onChange: handleOnChange,
		onFocus: handleOnFocus,
		onHoverOn: handleOnHoverOn,
		onHoverOff: handleOnHoverOff,
		isLinked,
		units,
		values: inputValues,
	};

	const presetUnit = units ? units : 'px';
	const options = [
		DEFAULT_OPTION,
		...presetValues.map( ( presetValue ) => ( {
			key: presetValue.slug,
			name: presetValue.name,
			value: presetValue.value + presetUnit,
		} ) ),
		CUSTOM_OPTION,
	];
	let selectedOption = DEFAULT_OPTION;
	if (
		!! inputValues?.top &&
		inputValues?.top === inputValues?.right &&
		inputValues?.top === inputValues?.bottom &&
		inputValues?.top === inputValues?.left
	) {
		selectedOption =
			options.find( ( option ) => option.value === inputValues.top ) ||
			CUSTOM_OPTION;
	}

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
					<BoxControlIcon side={ side } />
				</FlexItem>
			</Header>
			<HeaderControlWrapper className="component-box-control__header-control-wrapper">
				<FlexItem>
					<CustomSelectControl
						className={ 'component-box-control__preset' }
						options={ options }
						value={ selectedOption }
						onChange={ handleOnChangePresets }
					/>
				</FlexItem>
				<FlexItem>
					<AllInputControl
						{ ...inputControlProps }
						disabled={ ! isLinked }
					/>
				</FlexItem>
				<FlexItem>
					<Button
						className="component-box-control__reset-button"
						isSecondary
						isSmall
						onClick={ handleOnReset }
						disabled={ ! isDirty }
					>
						{ __( 'Reset' ) }
					</Button>
				</FlexItem>
			</HeaderControlWrapper>
			<HeaderControlWrapper>
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
