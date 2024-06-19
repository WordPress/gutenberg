/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import InputBase from '../input-control/input-base';
import { Select } from './styles/select-control-styles';
import type { WordPressComponentProps } from '../context';
import type { SelectControlProps } from './types';
import SelectControlChevronDown from './chevron-down';
import { useDeprecated36pxDefaultSizeProp } from '../utils/use-deprecated-props';

function useUniqueId( idProp?: string ) {
	const instanceId = useInstanceId( SelectControl );
	const id = `inspector-select-control-${ instanceId }`;

	return idProp || id;
}

function UnforwardedSelectControl(
	props: WordPressComponentProps< SelectControlProps, 'select', false >,
	ref: React.ForwardedRef< HTMLSelectElement >
) {
	const {
		className,
		disabled = false,
		help,
		hideLabelFromVision,
		id: idProp,
		label,
		multiple = false,
		onChange,
		options = [],
		size = 'default',
		value: valueProp,
		labelPosition = 'top',
		children,
		prefix,
		suffix,
		__next40pxDefaultSize = false,
		__nextHasNoMarginBottom = false,
		...restProps
	} = useDeprecated36pxDefaultSizeProp( props );
	const id = useUniqueId( idProp );
	const helpId = help ? `${ id }__help` : undefined;

	// Disable reason: A select with an onchange throws a warning.
	if ( ! options?.length && ! children ) {
		return null;
	}

	const handleOnChange = (
		event: React.ChangeEvent< HTMLSelectElement >
	) => {
		if ( props.multiple ) {
			const selectedOptions = Array.from( event.target.options ).filter(
				( { selected } ) => selected
			);
			const newValues = selectedOptions.map( ( { value } ) => value );
			props.onChange?.( newValues, { event } );
			return;
		}

		props.onChange?.( event.target.value, { event } );
	};

	const classes = clsx( 'components-select-control', className );

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
				label={ label }
				size={ size }
				suffix={
					suffix || ( ! multiple && <SelectControlChevronDown /> )
				}
				prefix={ prefix }
				labelPosition={ labelPosition }
				__next40pxDefaultSize={ __next40pxDefaultSize }
			>
				<Select
					{ ...restProps }
					__next40pxDefaultSize={ __next40pxDefaultSize }
					aria-describedby={ helpId }
					className="components-select-control__input"
					disabled={ disabled }
					id={ id }
					multiple={ multiple }
					onChange={ handleOnChange }
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
									hidden={ option.hidden }
								>
									{ option.label }
								</option>
							);
						} ) }
				</Select>
			</InputBase>
		</BaseControl>
	);
}

/**
 * `SelectControl` allows users to select from a single or multiple option menu.
 * It functions as a wrapper around the browser's native `<select>` element.
 *
 * ```jsx
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
 * ```
 */
export const SelectControl = forwardRef( UnforwardedSelectControl );

export default SelectControl;
