import clsx from 'clsx';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useRef, useState } from '@wordpress/element';
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
	// React tracks the value through the instance's `value` property, so the
	// prototype setter is needed for React to see the change.
	Object.getOwnPropertyDescriptor(
		Object.getPrototypeOf( input ),
		'value'
	)?.set?.call( input, '' );
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
			'aria-label': ariaLabel = __( 'Search' ),
			placeholder = __( 'Search' ),
			autoComplete = 'off',
			value,
			defaultValue,
			onValueChange,
			disabled,
			readOnly,
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

		const onReset = () => {
			const input = inputRef.current;
			if ( ! input ) {
				return;
			}
			// The reset button unmounts once the field is empty, so move focus
			// to the field first.
			input.focus();
			clearInput( input );
		};

		return (
			<Input
				ref={ mergedRef }
				type="search"
				className={ clsx( styles[ 'search-input' ], className ) }
				aria-label={ ariaLabel }
				placeholder={ placeholder }
				autoComplete={ autoComplete }
				value={ value }
				defaultValue={ defaultValue }
				onValueChange={ ( nextValue, eventDetails ) => {
					setUncontrolledHasValue( nextValue !== '' );
					onValueChange?.( nextValue, eventDetails );
				} }
				disabled={ disabled }
				readOnly={ readOnly }
				prefix={ <SearchIconSlot /> }
				suffix={
					hasValue &&
					! disabled &&
					! readOnly && (
						<InputLayout.Slot padding="minimal">
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
