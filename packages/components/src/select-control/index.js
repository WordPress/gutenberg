/**
 * External dependencies
 */
import { isEmpty, noop } from 'lodash';
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useState, forwardRef } from '@wordpress/element';
import { Icon, chevronDown } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import InputBase from '../input-control/input-base';
import { Select, DownArrowWrapper } from './styles/select-control-styles';

function useUniqueId( idProp ) {
	const instanceId = useInstanceId( SelectControl );
	const id = `inspector-select-control-${ instanceId }`;

	return idProp || id;
}

function SelectControl(
	{
		className,
		disabled = false,
		help,
		hideLabelFromVision,
		id: idProp,
		label,
		multiple = false,
		onBlur = noop,
		onChange = noop,
		onFocus = noop,
		options = [],
		size = 'default',
		value: valueProp,
		labelPosition = 'top',
		...props
	},
	ref
) {
	const [ isFocused, setIsFocused ] = useState( false );
	const id = useUniqueId( idProp );
	const helpId = help ? `${ id }__help` : undefined;

	// Disable reason: A select with an onchange throws a warning
	if ( isEmpty( options ) ) return null;

	const handleOnBlur = ( event ) => {
		onBlur( event );
		setIsFocused( false );
	};

	const handleOnFocus = ( event ) => {
		onFocus( event );
		setIsFocused( true );
	};

	const handleOnChange = ( event ) => {
		if ( multiple ) {
			const selectedOptions = [ ...event.target.options ].filter(
				( { selected } ) => selected
			);
			const newValues = selectedOptions.map( ( { value } ) => value );
			onChange( newValues );
			return;
		}

		onChange( event.target.value, { event } );
	};

	const classes = classNames( 'components-select-control', className );

	/* eslint-disable jsx-a11y/no-onchange */
	return (
		<BaseControl help={ help }>
			<InputBase
				className={ classes }
				disabled={ disabled }
				hideLabelFromVision={ hideLabelFromVision }
				id={ id }
				isFocused={ isFocused }
				label={ label }
				size={ size }
				suffix={
					<DownArrowWrapper>
						<Icon icon={ chevronDown } size={ 18 } />
					</DownArrowWrapper>
				}
				labelPosition={ labelPosition }
				{ ...props }
			>
				<Select
					{ ...props }
					aria-describedby={ helpId }
					className="components-select-control__input"
					disabled={ disabled }
					id={ id }
					multiple={ multiple }
					onBlur={ handleOnBlur }
					onChange={ handleOnChange }
					onFocus={ handleOnFocus }
					ref={ ref }
					size={ size }
					value={ valueProp }
				>
					{ options.map( ( option, index ) => {
						const key =
							option.id ||
							`${ option.label }-${ option.value }-${ index }`;

						return (
							<option
								key={ key }
								value={ option.value }
								disabled={ option.disabled }
							>
								{ option.label }
							</option>
						);
					} ) }
				</Select>
			</InputBase>
		</BaseControl>
	);
	/* eslint-enable jsx-a11y/no-onchange */
}

const ForwardedComponent = forwardRef( SelectControl );

export default ForwardedComponent;
