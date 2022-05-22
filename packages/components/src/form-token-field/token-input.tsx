/**
 * External dependencies
 */
import classnames from 'classnames';
import type { ChangeEvent, ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../ui/context';
import type { TokenInputProps } from './types';

export function UnForwardedTokenInput(
	props: WordPressComponentProps< TokenInputProps, 'input' >,
	ref: ForwardedRef< HTMLInputElement >
) {
	const {
		value,
		isExpanded,
		instanceId,
		selectedSuggestionIndex,
		className,
		onChange,
		...restProps
	} = props;

	const size = value ? value.length + 1 : 0;

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
			onChange={ onChange ? onChangeHandler : undefined }
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
				selectedSuggestionIndex !== -1
					? `components-form-token-suggestions-${ instanceId }-${ selectedSuggestionIndex }`
					: undefined
			}
			aria-describedby={ `components-form-token-suggestions-howto-${ instanceId }` }
		/>
	);
}

export const TokenInput = forwardRef( UnForwardedTokenInput );

export default TokenInput;
