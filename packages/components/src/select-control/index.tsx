/**
 * External dependencies
 */
import classNames from 'classnames';
import type { ChangeEvent, FocusEvent, ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useState, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import InputBase from '../input-control/input-base';
import { Select } from './styles/select-control-styles';
import type { WordPressComponentProps } from '../ui/context';
import type { SelectControlProps } from './types';
import SelectControlChevronDown from './chevron-down';

const noop = () => {};

function useUniqueId( idProp?: string ) {
	const instanceId = useInstanceId( SelectControl );
	const id = `inspector-select-control-${ instanceId }`;

	return idProp || id;
}

function UnforwardedSelectControl(
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
		__next36pxDefaultSize = false,
		__nextHasNoMarginBottom = false,
		...props
	}: WordPressComponentProps< SelectControlProps, 'select', false >,
	ref: ForwardedRef< HTMLSelectElement >
) {
	const [ isFocused, setIsFocused ] = useState( false );
	const id = useUniqueId( idProp );
	const helpId = help ? `${ id }__help` : undefined;

	// Disable reason: A select with an onchange throws a warning.
	if ( ! options?.length && ! children ) return null;

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
		<BaseControl
			help={ help }
			id={ id }
			__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
		>
			<InputBase
				className={ classes }
				disabled={ disabled }
				hideLabelFromVision={ hideLabelFromVision }
				id={ id }
				isFocused={ isFocused }
				label={ label }
				size={ size }
				suffix={ suffix || <SelectControlChevronDown /> }
				prefix={ prefix }
				labelPosition={ labelPosition }
				__next36pxDefaultSize={ __next36pxDefaultSize }
			>
				<Select
					{ ...props }
					__next36pxDefaultSize={ __next36pxDefaultSize }
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

/**
 * `SelectControl` allows users to select from a single or multiple option menu.
 * It functions as a wrapper around the browser's native `<select>` element.
 *
 * @example
 * import { SelectControl } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MySelectControl = () => {
 *   const [ size, setSize ] = useState( '50%' );
 *
 *   return (
 *     <SelectControl
 *       label="Size"
 *       value={ size }
 *       options={ [
 *         { label: 'Big', value: '100%' },
 *         { label: 'Medium', value: '50%' },
 *         { label: 'Small', value: '25%' },
 *       ] }
 *       onChange={ setSize }
 *     />
 *   );
 * };
 */
export const SelectControl = forwardRef( UnforwardedSelectControl );

export default SelectControl;
