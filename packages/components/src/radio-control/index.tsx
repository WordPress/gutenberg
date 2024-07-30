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
import { useBaseControlProps } from '../base-control/hooks';
import { StyledHelp } from '../base-control/styles/base-control-styles';

function generateOptionDescriptionId( radioGroupId: string, index: number ) {
	return `${ radioGroupId }-${ index }-option-description`;
}

function generateOptionId( radioGroupId: string, index: number ) {
	return `${ radioGroupId }-${ index }`;
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
		id: preferredId,
		...additionalProps
	} = props;
	const id = useInstanceId(
		RadioControl,
		'inspector-radio-control',
		preferredId
	);

	const onChangeValue = ( event: ChangeEvent< HTMLInputElement > ) =>
		onChange( event.target.value );

	// Use `useBaseControlProps` to get the id of the help text.
	const {
		controlProps: { 'aria-describedby': helpTextId },
	} = useBaseControlProps( { id, help } );

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
				className={ clsx( 'components-radio-control__group-wrapper', {
					'has-help': !! help,
				} ) }
			>
				{ options.map( ( option, index ) => (
					<div
						key={ generateOptionId( id, index ) }
						className="components-radio-control__option"
					>
						<input
							id={ generateOptionId( id, index ) }
							className="components-radio-control__input"
							type="radio"
							name={ id }
							value={ option.value }
							onChange={ onChangeValue }
							checked={ option.value === selected }
							aria-describedby={
								clsx( [
									!! option.description &&
										generateOptionDescriptionId(
											id,
											index
										),
									helpTextId,
								] ) || undefined
							}
							{ ...additionalProps }
						/>
						<label
							className="components-radio-control__label"
							htmlFor={ generateOptionId( id, index ) }
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
