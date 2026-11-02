import { _x } from '@wordpress/i18n';
import { useId, useRef } from '@wordpress/element';
import { useIsomorphicLayoutEffect } from '@wordpress/compose';
import {
	daysInMonth,
	formatDigits,
	normalizeDigits,
	type DateDraft,
	type DatePart,
} from './date-model';
import hiddenStyles from '../../../visually-hidden/style.module.css';
import styles from './style.module.css';

interface DateSegmentProps {
	part: DatePart;
	draft: DateDraft;
	locale: string;
	direction: 'ltr' | 'rtl';
	controlProps: React.ComponentPropsWithoutRef< 'input' >;
	invalid: boolean;
	describedBy?: string;
	onChange: ( part: DatePart, value: string ) => void;
	onMove: ( offset: number ) => void;
}

export function DateSegment( {
	part,
	draft,
	locale,
	direction,
	controlProps,
	invalid,
	describedBy,
	onChange,
	onMove,
}: DateSegmentProps ) {
	const labelId = useId();
	const inputRef = useRef< HTMLInputElement >( null );
	const selectAfterChangeRef = useRef( false );
	useIsomorphicLayoutEffect( () => {
		if ( selectAfterChangeRef.current ) {
			inputRef.current?.select();
			selectAfterChangeRef.current = false;
		}
	} );
	const labels = {
		year: _x( 'year', 'date input segment' ),
		month: _x( 'month', 'date input segment' ),
		day: _x( 'day', 'date input segment' ),
	};
	const placeholders = {
		year: _x( 'yyyy', 'date input year placeholder' ),
		month: _x( 'mm', 'date input month placeholder' ),
		day: _x( 'dd', 'date input day placeholder' ),
	};
	const value = draft[ part ];
	const max = {
		year: 9999,
		month: 12,
		day: daysInMonth(
			Number( draft.year ) || new Date().getFullYear(),
			Number( draft.month ) || 1
		),
	}[ part ];
	const digits = part === 'year' ? 4 : 2;
	const label = labels[ part ];
	const readOnly = controlProps.readOnly;
	const disabled = controlProps.disabled;
	return (
		<>
			<span
				id={ labelId }
				className={ hiddenStyles[ 'visually-hidden' ] }
			>
				{ label },
			</span>
			<input
				ref={ inputRef }
				className={ styles.segment }
				type="text"
				role="spinbutton"
				inputMode="numeric"
				autoComplete="off"
				size={ digits }
				value={ formatDigits( value, locale ) }
				placeholder={ placeholders[ part ] }
				disabled={ disabled }
				readOnly={ readOnly }
				aria-disabled={ disabled || undefined }
				aria-readonly={ readOnly || undefined }
				aria-required={ controlProps.required || undefined }
				aria-invalid={ invalid || undefined }
				aria-valuemin={ 1 }
				aria-valuemax={ max }
				aria-valuenow={ value ? Number( value ) : undefined }
				aria-valuetext={
					value ? formatDigits( value, locale ) : undefined
				}
				aria-label={
					controlProps[ 'aria-labelledby' ]
						? undefined
						: `${ label }, ${ controlProps[ 'aria-label' ] ?? '' }`
				}
				aria-labelledby={
					controlProps[ 'aria-labelledby' ]
						? `${ labelId } ${ controlProps[ 'aria-labelledby' ] }`
						: undefined
				}
				aria-describedby={ describedBy }
				onFocus={ ( event ) => event.currentTarget.select() }
				onChange={ ( event ) => {
					const next = normalizeDigits(
						event.currentTarget.value,
						locale
					);
					if (
						readOnly ||
						disabled ||
						! /^\d*$/.test( next ) ||
						next.length > digits
					) {
						return;
					}
					onChange( part, next );
					// Allow a two-digit impossible day to remain visible for validation.
					const typingMax = part === 'day' ? 31 : max;
					if (
						next.length === digits ||
						Number( next ) * 10 > typingMax
					) {
						onMove( 1 );
					}
				} }
				onKeyDown={ ( event ) => {
					if (
						event.key === 'ArrowLeft' ||
						event.key === 'ArrowRight'
					) {
						event.preventDefault();
						onMove(
							( event.key === 'ArrowRight' ? 1 : -1 ) *
								( direction === 'rtl' ? -1 : 1 )
						);
						return;
					}
					if ( readOnly || disabled ) {
						return;
					}
					const number =
						Number( value ) ||
						( part === 'year' ? new Date().getFullYear() : 1 );
					let next: string;
					if ( event.key === 'Backspace' || event.key === 'Delete' ) {
						if ( value === '' ) {
							event.preventDefault();
							onMove( -1 );
							return;
						}
						next = value.slice( 0, -1 );
					} else if ( event.key === 'Home' || event.key === 'End' ) {
						next = String( event.key === 'Home' ? 1 : max );
					} else if (
						[
							'ArrowUp',
							'ArrowDown',
							'PageUp',
							'PageDown',
						].includes( event.key )
					) {
						const step = event.key.startsWith( 'Page' )
							? { year: 5, month: 2, day: 7 }[ part ]
							: 1;
						const delta = event.key.endsWith( 'Up' ) ? step : -step;
						const start =
							part === 'year' && step > 1
								? ( delta > 0 ? Math.floor : Math.ceil )(
										number / step
									) * step
								: number;
						next = String(
							( ( ( ( start - 1 + delta ) % max ) + max ) %
								max ) +
								1
						);
					} else {
						return;
					}
					event.preventDefault();
					selectAfterChangeRef.current =
						event.key !== 'Backspace' && event.key !== 'Delete';
					onChange( part, next );
				} }
			/>
		</>
	);
}
