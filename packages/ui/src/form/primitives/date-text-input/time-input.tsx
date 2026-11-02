import { forwardRef, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { TemporalInput } from './temporal-input';
import { getTimeError, parseTime, serializeTime } from './validation';
import type { TimeInputProps } from './types';

/** A local 24-hour time text input with custom validation. */
export const TimeInput = forwardRef< HTMLInputElement, TimeInputProps >(
	function UnforwardedTimeInput(
		{ min, max, precision = 'minute', ...props },
		ref
	) {
		if ( min !== undefined ) {
			serializeTime( min, precision );
		}
		if ( max !== undefined ) {
			serializeTime( max, precision );
		}
		if ( min && max && min > max ) {
			throw new RangeError( 'TimeInput: min must not be after max.' );
		}
		const serialize = useCallback(
			( value: string | null ) => serializeTime( value, precision ),
			[ precision ]
		);
		return (
			<TemporalInput
				{ ...props }
				inputRef={ ref }
				formatDescription={
					precision === 'second'
						? __( 'Use 24-hour HH:mm:ss, for example 10:30:00.' )
						: __( 'Use 24-hour HH:mm, for example 10:30.' )
				}
				placeholder={
					props.placeholder ??
					( precision === 'second' ? 'HH:mm:ss' : 'HH:mm' )
				}
				parse={ ( text ) => parseTime( text, precision ) }
				serialize={ serialize }
				getError={ ( text ) =>
					getTimeError( text, precision, min, max )
				}
			/>
		);
	}
);
