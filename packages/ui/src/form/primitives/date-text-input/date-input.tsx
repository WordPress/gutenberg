import { useRender } from '@base-ui/react/use-render';
import {
	forwardRef,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { VisuallyHidden } from '../../../visually-hidden';
import { Input } from '../input';
import type { InputProps } from '../input/types';
import {
	assertDateConstraints,
	getDateError,
	serializeDate,
} from './validation';
import { createDateFormat } from './date-format';
import type { DateInputProps } from './types';

const NativeEditor = forwardRef<
	HTMLInputElement,
	React.ComponentPropsWithoutRef< 'input' > & {
		consumerRender: InputProps[ 'render' ];
		formatDescription: string;
		formValue: string;
	}
>( function UnforwardedNativeEditor(
	{ consumerRender, formatDescription, formValue, ...props },
	ref
) {
	const formatId = useId();
	const input = useRender( {
		defaultTagName: 'input',
		render: consumerRender,
		ref,
		props: {
			...props,
			name: undefined,
			'aria-describedby': [ props[ 'aria-describedby' ], formatId ]
				.filter( Boolean )
				.join( ' ' ),
		},
	} );
	return (
		<>
			{ input }
			<VisuallyHidden id={ formatId }>
				{ formatDescription }
			</VisuallyHidden>
			<input
				type="hidden"
				name={ props.name }
				form={ props.form }
				disabled={ props.disabled }
				value={ formValue }
			/>
		</>
	);
} );

/**
 * Localized single-date experiment. Native forms submit ISO dates.
 * Blocked: Base UI Form and Field.validate still receive the visible text.
 */
export const DateInput = forwardRef< HTMLInputElement, DateInputProps >(
	function UnforwardedDateInput(
		{
			value,
			defaultValue = null,
			onValueChange,
			locale,
			min,
			max,
			isDateUnavailable,
			render,
			...props
		},
		forwardedRef
	) {
		const constraints = { min, max, isDateUnavailable };
		assertDateConstraints( constraints );
		serializeDate( defaultValue );
		const format = useMemo( () => createDateFormat( locale ), [ locale ] );
		const [ uncontrolledValue, setUncontrolledValue ] =
			useState( defaultValue );
		const currentValue = value === undefined ? uncontrolledValue : value;
		const key = serializeDate( currentValue );
		const display = format.format( currentValue );
		const [ draft, setDraft ] = useState( { key, format, text: display } );
		let text = draft.text;
		if ( draft.key !== key || draft.format !== format ) {
			text = display;
			setDraft( { key, format, text } );
		}
		let parsed = format.parse( text );
		if ( parsed !== undefined && serializeDate( parsed ) !== key ) {
			text = display;
			parsed = currentValue;
			setDraft( { key, format, text } );
		}
		const error =
			parsed === undefined
				? sprintf(
						/* translators: %s: Localized numeric date pattern, for example DD/MM/YYYY. */ __(
							'Enter a valid date in %s format.'
						),
						format.placeholder
					)
				: getDateError( parsed ?? '', constraints, format.format );
		const nativeRef = useRef< HTMLInputElement >( null );
		const validityRef = useCallback(
			( element: HTMLInputElement | null ) =>
				element?.setCustomValidity( error ),
			[ error ]
		);
		const ref = useMergeRefs( [ nativeRef, forwardedRef, validityRef ] );

		useEffect( () => {
			const form = nativeRef.current?.form;
			const reset = ( event: Event ) =>
				queueMicrotask( () => {
					if ( event.defaultPrevented ) {
						return;
					}
					const next = value === undefined ? defaultValue : value;
					if ( value === undefined ) {
						setUncontrolledValue( next );
					}
					setDraft( {
						key: serializeDate( next ),
						format,
						text: format.format( next ),
					} );
				} );
			form?.addEventListener( 'reset', reset );
			return () => form?.removeEventListener( 'reset', reset );
		}, [ value, defaultValue, format, props.form ] );

		return (
			<Input
				{ ...props }
				ref={ ref }
				type="text"
				placeholder={ props.placeholder ?? format.placeholder }
				value={ text }
				onValueChange={ ( nextText, details ) => {
					const nextValue = format.parse( nextText );
					if (
						nextValue !== undefined &&
						serializeDate( nextValue ) !== key
					) {
						onValueChange?.( nextValue, {
							event: details.event,
							reason: 'input-change',
							cancel: details.cancel,
							get isCanceled() {
								return details.isCanceled;
							},
						} );
						if ( details.isCanceled ) {
							setDraft( { key, format, text: display } );
							return;
						}
						if ( value === undefined ) {
							setUncontrolledValue( nextValue );
						}
					}
					setDraft( { key, format, text: nextText } );
				} }
				render={ ( nativeProps ) => (
					<NativeEditor
						{ ...nativeProps }
						consumerRender={ render }
						formValue={ parsed ?? '' }
						formatDescription={ sprintf(
							/* translators: 1: Numeric date pattern. 2: Example date. */ __(
								'Use %1$s, for example %2$s.'
							),
							format.placeholder,
							format.format( '2026-01-20' )
						) }
					/>
				) }
			/>
		);
	}
);
