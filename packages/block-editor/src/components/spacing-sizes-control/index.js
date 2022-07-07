/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	FlexItem,
	FlexBlock,
	Text,
	Button,
	useControlledState,
} from '@wordpress/components';

/**
 * Internal dependencies
 */

import AllInputControl from './all-input-control';
import InputControls from './input-controls';
import AxialInputControls from './axial-input-controls';
import BoxControlIcon from './icon';
import LinkedButton from './linked-button';
import {
	Root,
	Header,
	HeaderControlWrapper,
} from './styles/box-control-styles';
import {
	DEFAULT_VALUES,
	getInitialSide,
	isValuesMixed,
	isValuesDefined,
} from './utils';

const defaultInputProps = {
	min: 0,
};

const noop = () => {};

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
	sides,
	splitOnAxis = false,
	allowReset = true,
	resetValues = DEFAULT_VALUES,
	spacingSizes,
} ) {
	const [ values, setValues ] = useControlledState( valuesProp, {
		fallback: DEFAULT_VALUES,
	} );
	const inputValues = values || DEFAULT_VALUES;
	const hasInitialValue = isValuesDefined( valuesProp );
	const hasOneSide = sides?.length === 1;

	const [ isDirty, setIsDirty ] = useState( hasInitialValue );
	const [ isLinked, setIsLinked ] = useState(
		! hasInitialValue || ! isValuesMixed( inputValues ) || hasOneSide
	);

	const [ side, setSide ] = useState(
		getInitialSide( isLinked, splitOnAxis )
	);

	const id = useUniqueId( idProp );
	const headingId = `${ id }-heading`;

	const toggleLinked = () => {
		setIsLinked( ! isLinked );
		setSide( getInitialSide( ! isLinked, splitOnAxis ) );
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
		onChange( resetValues );
		setValues( resetValues );
		setIsDirty( false );
	};

	const inputControlProps = {
		...inputProps,
		onChange: handleOnChange,
		onFocus: handleOnFocus,
		isLinked,
		units,
		sides,
		values: inputValues,
		spacingSizes,
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
				{ allowReset && (
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
				) }
			</Header>
			<HeaderControlWrapper className="component-box-control__header-control-wrapper">
				<FlexItem>
					<BoxControlIcon side={ side } sides={ sides } />
				</FlexItem>
				{ isLinked && (
					<FlexBlock>
						<AllInputControl
							aria-label={ label }
							{ ...inputControlProps }
						/>
					</FlexBlock>
				) }
				{ ! isLinked && splitOnAxis && (
					<FlexBlock>
						<AxialInputControls { ...inputControlProps } />
					</FlexBlock>
				) }
				{ ! hasOneSide && (
					<FlexItem>
						<LinkedButton
							onClick={ toggleLinked }
							isLinked={ isLinked }
						/>
					</FlexItem>
				) }
			</HeaderControlWrapper>
			{ ! isLinked && ! splitOnAxis && (
				<InputControls { ...inputControlProps } />
			) }
		</Root>
	);
}
