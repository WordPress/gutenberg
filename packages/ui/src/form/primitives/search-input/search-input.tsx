import clsx from 'clsx';
import { useIsomorphicLayoutEffect, useMergeRefs } from '@wordpress/compose';
import { forwardRef, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { IconButton } from '../../../icon-button';
import { Input } from '../input';
import { InputLayout } from '../input-layout';
import { SearchIconSlot } from './search-icon-slot';
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
 * that resets the search.
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
		const inputRef = useRef< HTMLInputElement >( null );
		const mergedRef = useMergeRefs( [ inputRef, ref ] );
		const isControlled = value !== undefined;
		const [ uncontrolledHasValue, setUncontrolledHasValue ] =
			useState( !! defaultValue );
		const hasValue = isControlled ? value !== '' : uncontrolledHasValue;
		const [ hasLabelElement, setHasLabelElement ] = useState( false );

		// A default `aria-label` would override an associated `<label>`.
		useIsomorphicLayoutEffect( () => {
			setHasLabelElement( !! inputRef.current?.labels?.length );
		}, [] );

		useEffect( () => {
			const form = inputRef.current?.form;
			if ( ! form ) {
				return;
			}
			// The form restores its fields only after the `reset` event, and
			// without an `input` event.
			const onFormReset = () =>
				setTimeout( () =>
					setUncontrolledHasValue( !! inputRef.current?.value )
				);
			form.addEventListener( 'reset', onFormReset );
			return () => form.removeEventListener( 'reset', onFormReset );
		}, [] );

		const onReset = () => {
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
				onValueChange={ ( nextValue, eventDetails ) => {
					setUncontrolledHasValue( nextValue !== '' );
					onValueChange?.( nextValue, eventDetails );
				} }
				prefix={ <SearchIconSlot /> }
				suffix={
					hasValue && (
						<InputLayout.Slot
							padding="minimal"
							className={ styles[ 'reset-slot' ] }
						>
							<IconButton
								icon={ closeSmall }
								label={ __( 'Reset search' ) }
								onClick={ onReset }
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
