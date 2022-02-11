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
import { FlexItem, FlexBlock } from '../flex';
import AllInputControl from './all-input-control';
import InputControls from './input-controls';
import AxialInputControls from './axial-input-controls';
import BoxControlIcon from './icon';
import { Text } from '../text';
import LinkedButton from './linked-button';
import Visualizer from './visualizer';
import {
	Root,
	Header,
	HeaderControlWrapper,
} from './styles/box-control-styles';
import { parseUnit, supportsCustomCSS } from '../unit-control/utils';
import {
	DEFAULT_VALUES,
	DEFAULT_VISUALIZER_VALUES,
	getInitialSide,
	isValuesMixed,
	isValuesDefined,
} from './utils';
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
	onChangeShowVisualizer = noop,
	label = __( 'Box Control' ),
	values: valuesProp,
	units,
	sides,
	splitOnAxis = false,
	allowReset = true,
	resetValues = DEFAULT_VALUES,
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

	// Tracking selected units via internal state allows filtering of CSS unit
	// only values from being saved while maintaining preexisting unit selection
	// behaviour. Filtering CSS only values prevents invalid style values.
	const [ selectedUnits, setSelectedUnits ] = useState( {
		top: parseUnit( valuesProp?.top )[ 1 ],
		right: parseUnit( valuesProp?.right )[ 1 ],
		bottom: parseUnit( valuesProp?.bottom )[ 1 ],
		left: parseUnit( valuesProp?.left )[ 1 ],
	} );

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

	const handleOnHoverOn = ( next = {} ) => {
		onChangeShowVisualizer( { ...DEFAULT_VISUALIZER_VALUES, ...next } );
	};

	const handleOnHoverOff = ( next = {} ) => {
		onChangeShowVisualizer( { ...DEFAULT_VISUALIZER_VALUES, ...next } );
	};

	const handleOnReset = () => {
		onChange( resetValues );
		setValues( resetValues );
		setSelectedUnits( resetValues );
		setIsDirty( false );
	};

	const inputControlProps = {
		...inputProps,
		onChange: handleOnChange,
		onFocus: handleOnFocus,
		onHoverOn: handleOnHoverOn,
		onHoverOff: handleOnHoverOff,
		isLinked,
		units,
		selectedUnits,
		setSelectedUnits,
		sides,
		supportsCustomCSS: supportsCustomCSS( units ),
		values: inputValues,
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

BoxControl.__Visualizer = Visualizer;
