import { useRef } from '@wordpress/element';
import { GregorianCalendar, parseDate } from '@internationalized/date';
import { I18nProvider, useLocale } from 'react-aria/I18nProvider';
import { useDateField, useDateSegment } from 'react-aria/useDateField';
import {
	useDateFieldState,
	type DateFieldState,
	type DateSegment,
} from 'react-stately/useDateFieldState';

function Segment( {
	segment,
	state,
}: {
	segment: DateSegment;
	state: DateFieldState;
} ) {
	const ref = useRef< HTMLSpanElement >( null );
	const { segmentProps } = useDateSegment( segment, state, ref );
	return (
		<span ref={ ref } { ...segmentProps }>
			{ segment.text }
		</span>
	);
}

function Reference( {
	onValueChange,
}: {
	onValueChange: ( value: string | null ) => void;
} ) {
	const ref = useRef< HTMLDivElement >( null );
	const { locale } = useLocale();
	const props = {
		'aria-label': 'Date',
		defaultValue: parseDate( '2026-01-20' ),
		onChange: ( value: ReturnType< typeof parseDate > | null ) =>
			onValueChange( value?.toString() ?? null ),
	};
	const state = useDateFieldState( {
		...props,
		locale,
		createCalendar: () => new GregorianCalendar(),
	} );
	const { fieldProps } = useDateField( props, state, ref );
	return (
		<div { ...fieldProps } ref={ ref }>
			{ state.segments.map( ( segment, index ) => (
				<Segment key={ index } segment={ segment } state={ state } />
			) ) }
		</div>
	);
}

/** Independent reference: no WordPress date parser, editor, or Base UI adapter. */
export function ReactAriaDateInput( {
	locale,
	onValueChange,
}: {
	locale: string;
	onValueChange: ( value: string | null ) => void;
} ) {
	return (
		<I18nProvider locale={ locale }>
			<Reference onValueChange={ onValueChange } />
		</I18nProvider>
	);
}
