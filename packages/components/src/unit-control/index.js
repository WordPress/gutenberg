/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { UP, DOWN, LEFT, RIGHT, ENTER } from '@wordpress/keycodes';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Root, ValueInput } from './styles/unit-control-styles';
import UnitSelectControl from './unit-select-control';
import { CSS_UNITS } from './utils';
import { useValueState, isEmpty } from '../input-control/utils';

function UnitControl(
	{
		className,
		disableUnits = false,
		isPressEnterToChange = true,
		isResetValueOnUnitChange = true,
		isUnitSelectTabbable = true,
		label,
		onBlur = noop,
		onChange = noop,
		onKeyDown = noop,
		onUnitChange = noop,
		size = 'default',
		style,
		unit = 'px',
		units = CSS_UNITS,
		value: valueProp,
		...props
	},
	ref
) {
	const [ value, setValue ] = useValueState( valueProp );

	const handleOnBlur = ( event ) => {
		onBlur( event );
		if ( isPressEnterToChange && ! isEmpty( value ) ) {
			onChange( value, { event } );
		}
	};

	const handleOnKeyDown = ( event ) => {
		onKeyDown( event );

		if ( isPressEnterToChange && event.keyCode === ENTER ) {
			event.preventDefault();
			event.stopPropagation();

			onChange( value, { event } );
		}
	};

	const handleOnChange = ( nextValue, changeProps ) => {
		const { event } = changeProps;
		setValue( nextValue );

		if ( ! isPressEnterToChange || event.type === 'mousemove' ) {
			onChange( nextValue, changeProps );
		} else if (
			[ UP, DOWN, LEFT, RIGHT ].some(
				( keyCode ) => keyCode === changeProps.event.keyCode
			)
		) {
			onChange( nextValue, changeProps );
		}
	};

	const handleOnUnitChange = ( unitValue, changeProps ) => {
		const { data } = changeProps;
		onUnitChange( unitValue, changeProps );

		if ( isResetValueOnUnitChange && data.default !== undefined ) {
			onChange( data.default, changeProps );
		}
	};

	const classes = classnames( 'component-unit-control', className );

	const inputSuffix = ! disableUnits ? (
		<UnitSelectControl
			className="component-unit-control__select"
			isTabbable={ isUnitSelectTabbable }
			options={ units }
			onChange={ handleOnUnitChange }
			size={ size }
			value={ unit }
		/>
	) : null;

	return (
		<Root className={ classes } ref={ ref } style={ style }>
			<ValueInput
				aria-label={ label }
				{ ...props }
				disableUnits={ disableUnits }
				className="component-unit-control__input"
				label={ label }
				value={ value }
				onBlur={ handleOnBlur }
				onChange={ handleOnChange }
				onKeyDown={ handleOnKeyDown }
				size={ size }
				suffix={ inputSuffix }
				type="number"
			></ValueInput>
		</Root>
	);
}

const ForwardedUnitControl = forwardRef( UnitControl );
ForwardedUnitControl.__defaultUnits = CSS_UNITS;

export default ForwardedUnitControl;
