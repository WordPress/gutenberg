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
import { StyledHelp } from '../base-control/styles/base-control-styles';

// This is the id that BaseControl assigns to the help text element.
function generateHelpTextId( id: string ) {
	return `${ id }__help`;
}

function generateOptionDescriptionId( id: string, index: number ) {
	return `${ id }-${ index }-option-description`;
}

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
			<VStack
				spacing={ 3 }
				className={ clsx(
					'components-radio-control__group-wrapper',
					!! help &&
						'components-radio-control__group-wrapper--with-help'
				) }
			>
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
							aria-describedby={ [
								!! option.description
									? generateOptionDescriptionId( id, index )
									: undefined,
								!! help ? generateHelpTextId( id ) : undefined,
							]
								.filter( Boolean )
								.join( ' ' ) }
							{ ...additionalProps }
						/>
						<label
							className="components-radio-control__label"
							htmlFor={ `${ id }-${ index }` }
						>
							{ option.label }
						</label>
						{ !! option.description ? (
							<StyledHelp
								__nextHasNoMarginBottom
								id={ generateOptionDescriptionId( id, index ) }
								className="components-radio-control__option-description"
							>
								{ option.description }
							</StyledHelp>
						) : null }
					</div>
				) ) }
			</VStack>
		</BaseControl>
	);
}

export default RadioControl;
