/**
 * External dependencies
 */
import { isEmpty, noop } from 'lodash';
import classNames from 'classnames';
import type { ChangeEvent, FocusEvent, ReactNode, ForwardedRef } from 'react';

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
import type { InputBaseProps, LabelPosition } from '../input-control/types';
import { Select, DownArrowWrapper } from './styles/select-control-styles';
import type { Size } from './types';
import type { WordPressComponentProps } from '../ui/context';

function useUniqueId( idProp?: string ) {
	const instanceId = useInstanceId( SelectControl );
	const id = `inspector-select-control-${ instanceId }`;

	return idProp || id;
}

export interface SelectControlProps
	extends Omit< InputBaseProps, 'children' | 'isFocused' > {
	help?: string;
	hideLabelFromVision?: boolean;
	multiple?: boolean;
	onBlur?: ( event: FocusEvent< HTMLSelectElement > ) => void;
	onFocus?: ( event: FocusEvent< HTMLSelectElement > ) => void;
	onChange?: (
		value: string | string[],
		extra?: { event?: ChangeEvent< HTMLSelectElement > }
	) => void;
	options?: {
		label: string;
		value: string;
		id?: string;
		disabled?: boolean;
	}[];
	size?: Size;
	value?: string | string[];
	labelPosition?: LabelPosition;
	children?: ReactNode;
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
		children,
		prefix,
		suffix,
		...props
	}: WordPressComponentProps< SelectControlProps, 'select', false >,
	ref: ForwardedRef< HTMLSelectElement >
) {
	const [ isFocused, setIsFocused ] = useState( false );
	const id = useUniqueId( idProp );
	const helpId = help ? `${ id }__help` : undefined;

	// Disable reason: A select with an onchange throws a warning.
	if ( isEmpty( options ) && ! children ) return null;

	const handleOnBlur = ( event: FocusEvent< HTMLSelectElement > ) => {
		onBlur( event );
		setIsFocused( false );
	};

	const handleOnFocus = ( event: FocusEvent< HTMLSelectElement > ) => {
		onFocus( event );
		setIsFocused( true );
	};

	const handleOnChange = ( event: ChangeEvent< HTMLSelectElement > ) => {
		if ( multiple ) {
			const selectedOptions = Array.from( event.target.options ).filter(
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
		<BaseControl help={ help } id={ id }>
			<InputBase
				className={ classes }
				disabled={ disabled }
				hideLabelFromVision={ hideLabelFromVision }
				id={ id }
				isFocused={ isFocused }
				label={ label }
				size={ size }
				suffix={
					suffix || (
						<DownArrowWrapper>
							<Icon icon={ chevronDown } size={ 18 } />
						</DownArrowWrapper>
					)
				}
				prefix={ prefix }
				labelPosition={ labelPosition }
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
					selectSize={ size }
					value={ valueProp }
				>
					{ children ||
						options.map( ( option, index ) => {
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
