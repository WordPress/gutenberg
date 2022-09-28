/**
 * External dependencies
 */
import classnames from 'classnames';
import type { ChangeEvent, ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../ui/context';
import type { TokenInputProps } from './types';

export function UnForwardedTokenInput(
	props: WordPressComponentProps< TokenInputProps, 'input', false >,
	ref: ForwardedRef< HTMLInputElement >
) {
	const {
		value,
		isExpanded,
		inputHasFocus,
		instanceId,
		selectedSuggestionIndex,
		className,
		onChange,
		...restProps
	} = props;

	const size = value ? value.length + 1 : 0;

	// Is this our first render? Take the value and find out if it should be. If no value, A11Y concerns will not exist so false is okay.
	const [ isInitialRender, setIsInitialRender ] = useState(
		value ? true : false
	);
	useEffect( () => {
		// If initial render is set to true but the user just placed focus on the input, now focus can be allowed.
		if ( isInitialRender && inputHasFocus ) {
			setIsInitialRender( false );
		}
	}, [ inputHasFocus ] );

	const onChangeHandler = ( event: ChangeEvent< HTMLInputElement > ) => {
		if ( onChange ) {
			onChange( {
				value: event.target.value,
			} );
		}
	};

	return (
		<input
			ref={ ref }
			id={ `components-form-token-input-${ instanceId }` }
			type="text"
			{ ...restProps }
			value={ value || '' }
			onChange={ onChangeHandler }
			size={ size }
			className={ classnames(
				className,
				'components-form-token-field__input'
			) }
			autoComplete="off"
			role="combobox"
			aria-expanded={ isExpanded }
			aria-autocomplete="list"
			aria-owns={
				isExpanded
					? `components-form-token-suggestions-${ instanceId }`
					: undefined
			}
			aria-activedescendant={
				! isInitialRender && selectedSuggestionIndex !== -1
					? `components-form-token-suggestions-${ instanceId }-${ selectedSuggestionIndex }`
					: undefined
			}
			aria-describedby={ `components-form-token-suggestions-howto-${ instanceId }` }
		/>
	);
}

export const TokenInput = forwardRef( UnForwardedTokenInput );

export default TokenInput;
