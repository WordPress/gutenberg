/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ChangeEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import type { WordPressComponentProps } from '../context';
import type { RadioControlProps } from './types';
import { VStack } from '../v-stack';

/**
 * Render a user interface to select the user type using radio inputs.
 *
 * ```jsx
 * import { RadioControl } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyRadioControl = () => {
 *   const [ option, setOption ] = useState( 'a' );
 *
 *   return (
 *     <RadioControl
 *       label="User type"
 *       help="The type of the current user"
 *       selected={ option }
 *       options={ [
 *         { label: 'Author', value: 'a' },
 *         { label: 'Editor', value: 'e' },
 *       ] }
 *       onChange={ ( value ) => setOption( value ) }
 *     />
 *   );
 * };
 * ```
 */
export function RadioControl(
	props: WordPressComponentProps< RadioControlProps, 'input', false >
) {
	const {
		label,
		className,
		selected,
		help,
		onChange,
		hideLabelFromVision,
		options = [],
		...additionalProps
	} = props;
	const instanceId = useInstanceId( RadioControl );
	const id = `inspector-radio-control-${ instanceId }`;
	const onChangeValue = ( event: ChangeEvent< HTMLInputElement > ) =>
		onChange( event.target.value );

	if ( ! options?.length ) {
		return null;
	}

	return (
		<BaseControl
			__nextHasNoMarginBottom
			label={ label }
			id={ id }
			hideLabelFromVision={ hideLabelFromVision }
			help={ help }
			className={ clsx( className, 'components-radio-control' ) }
		>
			<VStack spacing={ 3 }>
				{ options.map( ( option, index ) => (
					<div
						key={ `${ id }-${ index }` }
						className="components-radio-control__option"
					>
						<input
							id={ `${ id }-${ index }` }
							className="components-radio-control__input"
							type="radio"
							name={ id }
							value={ option.value }
							onChange={ onChangeValue }
							checked={ option.value === selected }
							aria-describedby={
								!! help ? `${ id }__help` : undefined
							}
							{ ...additionalProps }
						/>
						<label
							className="components-radio-control__label"
							htmlFor={ `${ id }-${ index }` }
						>
							{ option.label }
						</label>
					</div>
				) ) }
			</VStack>
		</BaseControl>
	);
}

export default RadioControl;
