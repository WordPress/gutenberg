import clsx from 'clsx';
import { useIsomorphicLayoutEffect, useMergeRefs } from '@wordpress/compose';
import { forwardRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { IconButton } from '../../../icon-button';
import { Input } from '../input';
import { InputLayout } from '../input-layout';
import { useInputValue } from '../input/use-input-value';
import { SearchIconSlot } from '../../../utils/search-icon-slot';
import styles from './style.module.css';
import type { SearchInputProps } from './types';

/**
 * Clears the field the way the browser's own clear button does, with a
 * native `input` event, so that `onValueChange` and the field state update
 * in both controlled and uncontrolled mode.
 */
function clearInput( input: HTMLInputElement ) {
	input.setRangeText( '', 0, input.value.length );
	input.dispatchEvent( new Event( 'input', { bubbles: true } ) );
}

/**
 * A low-level primitive for a search field, with a search icon and a button
 * that clears the search.
 *
 * Wrap it in `Field.Root` with a `Field.Label` to show a visible label.
 */
export const SearchInput = forwardRef< HTMLInputElement, SearchInputProps >(
	function UnforwardedSearchInput(
		{
			className,
			'aria-label': ariaLabel,
			placeholder = __( 'Search' ),
			autoComplete = 'off',
			value,
			defaultValue,
			onValueChange,
			...restProps
		},
		ref
	) {
		const {
			ref: inputRef,
			value: currentValue,
			onValueChange: handleValueChange,
		} = useInputValue( { value, defaultValue, onValueChange } );
		const mergedRef = useMergeRefs( [ inputRef, ref ] );
		const [ hasLabelElement, setHasLabelElement ] = useState( false );

		// A default `aria-label` would override an associated `<label>`.
		useIsomorphicLayoutEffect( () => {
			setHasLabelElement( !! inputRef.current?.labels?.length );
		}, [] );

		const onClear = () => {
			const input = inputRef.current;
			if ( ! input ) {
				return;
			}
			input.focus();
			clearInput( input );
		};

		return (
			<Input
				ref={ mergedRef }
				type="search"
				className={ clsx( styles[ 'search-input' ], className ) }
				aria-label={
					ariaLabel ??
					( hasLabelElement ? undefined : __( 'Search' ) )
				}
				placeholder={ placeholder }
				autoComplete={ autoComplete }
				value={ value }
				defaultValue={ defaultValue }
				onValueChange={ handleValueChange }
				prefix={ <SearchIconSlot /> }
				suffix={
					currentValue !== '' && (
						<InputLayout.Slot
							padding="minimal"
							className={ styles[ 'clear-slot' ] }
						>
							<IconButton
								icon={ closeSmall }
								label={ __( 'Clear search' ) }
								onClick={ onClear }
								size="small"
								variant="minimal"
								tone="neutral"
							/>
						</InputLayout.Slot>
					)
				}
				{ ...restProps }
			/>
		);
	}
);
