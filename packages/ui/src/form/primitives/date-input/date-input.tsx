import { Field as BaseField } from '@base-ui/react/field';
import {
	forwardRef,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { useIsomorphicLayoutEffect, useMergeRefs } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { InputLayout } from '../input-layout';
import { isLocaleRTL } from '../../../calendar/utils/use-localization-props';
import { DateSegment } from './date-segment';
import {
	getDateParts,
	getDateValue,
	parseDateValue,
	parseDatePaste,
	type DateDraft,
	type DatePart,
} from './date-model';
import hiddenStyles from '../../../visually-hidden/style.module.css';
import focusStyles from '../../../utils/css/focus.module.scss';
import styles from './style.module.css';

export interface DateInputProps {
	/** An ISO calendar date, or null for an empty controlled field. */
	value?: string | null;
	/** Initial ISO calendar date in uncontrolled mode. */
	defaultValue?: string | null;
	/** Called with an ISO calendar date, or null when cleared. */
	onValueChange?: ( value: string | null ) => void;
	/** BCP 47 locale. Independent of WordPress settings. */
	locale?: string;
	name?: string;
	id?: string;
	disabled?: boolean;
	readOnly?: boolean;
	required?: boolean;
	'aria-label'?: string;
	'aria-labelledby'?: string;
	'aria-describedby'?: string;
}

type ControlProps = React.ComponentPropsWithRef< 'input' >;

function Editor( {
	controlProps,
	value,
	locale,
	onValueChange,
}: {
	controlProps: ControlProps;
	value: string | null;
	locale: string;
	onValueChange: ( value: string | null ) => void;
} ) {
	const groupRef = useRef< HTMLDivElement >( null );
	const inputRef = useRef< HTMLInputElement >( null );
	const ref = useMergeRefs( [ controlProps.ref, inputRef ] );
	const [ snapshot, setSnapshot ] = useState( () => ( {
		value,
		draft: parseDateValue( value ),
	} ) );
	const pendingRef = useRef< { value: string | null } | null >( null );
	let draft = snapshot.draft;
	if ( snapshot.value !== value ) {
		draft =
			value !== null && getDateValue( draft ) === value
				? draft
				: parseDateValue( value );
		setSnapshot( { value, draft } );
	}
	useIsomorphicLayoutEffect( () => {
		if ( pendingRef.current && pendingRef.current.value !== value ) {
			setSnapshot( { value, draft: parseDateValue( value ) } );
		}
		pendingRef.current = null;
	} );
	const parts = useMemo( () => getDateParts( locale ), [ locale ] );
	const direction = isLocaleRTL( new Intl.Locale( locale ) ) ? 'rtl' : 'ltr';
	const isEmpty = Object.values( draft ).every( ( part ) => part === '' );
	const invalidDraft = ! isEmpty && getDateValue( draft ) === null;
	const invalid =
		invalidDraft ||
		controlProps[ 'aria-invalid' ] === true ||
		controlProps[ 'aria-invalid' ] === 'true';
	useIsomorphicLayoutEffect( () => {
		inputRef.current?.setCustomValidity(
			invalidDraft ? __( 'Enter a complete, valid date.' ) : ''
		);
	}, [ invalidDraft ] );
	function update( next: DateDraft ) {
		setSnapshot( { value, draft: next } );
		const canonical = getDateValue( next );
		if (
			canonical !== null ||
			Object.values( next ).every( ( part ) => part === '' )
		) {
			if ( canonical !== value ) {
				pendingRef.current = { value: canonical };
				onValueChange( canonical );
			}
		}
	}
	const editableParts = parts.filter( ( part ) =>
		[ 'year', 'month', 'day' ].includes( part.type )
	);
	return (
		<InputLayout
			visuallyDisabled={ controlProps.disabled }
			className={ focusStyles[ 'outset-ring--focus-within' ] }
		>
			<input
				{ ...controlProps }
				ref={ ref }
				className={ hiddenStyles[ 'visually-hidden' ] }
				tabIndex={ -1 }
				aria-hidden="true"
				onFocus={ ( event ) => {
					controlProps.onFocus?.( event );
					groupRef.current
						?.querySelector< HTMLInputElement >(
							'input:not(:disabled)'
						)
						?.focus();
				} }
			/>
			<div
				ref={ groupRef }
				role="group"
				dir={ direction }
				className={ styles.editor }
				aria-label={ controlProps[ 'aria-label' ] }
				aria-labelledby={ controlProps[ 'aria-labelledby' ] }
				onPaste={ ( event ) => {
					if ( controlProps.disabled || controlProps.readOnly ) {
						return;
					}
					const pasted = parseDatePaste(
						event.clipboardData.getData( 'text/plain' ),
						locale
					);
					if ( pasted ) {
						event.preventDefault();
						update( pasted );
					}
				} }
			>
				{ parts.map( ( part, index ) => {
					if (
						part.type !== 'year' &&
						part.type !== 'month' &&
						part.type !== 'day'
					) {
						return (
							<span key={ index } aria-hidden="true">
								{ part.value }
							</span>
						);
					}
					const segmentIndex = editableParts.findIndex(
						( item ) => item.type === part.type
					);
					return (
						<DateSegment
							key={ part.type }
							part={ part.type }
							draft={ draft }
							locale={ locale }
							direction={ direction }
							controlProps={ controlProps }
							invalid={ invalid }
							describedBy={
								invalid || segmentIndex === 0
									? controlProps[ 'aria-describedby' ]
									: undefined
							}
							onChange={ ( name: DatePart, text ) =>
								update( { ...draft, [ name ]: text } )
							}
							onMove={ ( offset ) =>
								groupRef.current
									?.querySelectorAll< HTMLInputElement >(
										'input'
									)
									[ segmentIndex + offset ]?.focus()
							}
						/>
					);
				} ) }
			</div>
		</InputLayout>
	);
}

/** First-party segmented date experiment. Base UI composite integration remains blocked. */
export const DateInput = forwardRef< HTMLInputElement, DateInputProps >(
	function UnforwardedDateInput(
		{
			value,
			defaultValue = null,
			onValueChange,
			locale = new Intl.DateTimeFormat().resolvedOptions().locale,
			...props
		},
		ref
	) {
		const [ uncontrolledValue, setUncontrolledValue ] =
			useState( defaultValue );
		const [ resetKey, setResetKey ] = useState( 0 );
		const inputRef = useRef< HTMLInputElement >( null );
		const mergedRef = useMergeRefs( [ ref, inputRef ] );
		const currentValue = value === undefined ? uncontrolledValue : value;
		useEffect( () => {
			const form = inputRef.current?.form;
			const reset = ( event: Event ) => {
				queueMicrotask( () => {
					if ( ! event.defaultPrevented && value === undefined ) {
						setUncontrolledValue( defaultValue );
						setResetKey( ( key ) => key + 1 );
					}
				} );
			};
			form?.addEventListener( 'reset', reset );
			return () => form?.removeEventListener( 'reset', reset );
		}, [ value, defaultValue ] );
		return (
			<BaseField.Control
				{ ...props }
				ref={ mergedRef }
				value={ currentValue ?? '' }
				render={ ( controlProps ) => (
					<Editor
						key={ resetKey }
						controlProps={ controlProps }
						value={ currentValue }
						locale={ locale }
						onValueChange={ ( next ) => {
							if ( value === undefined ) {
								setUncontrolledValue( next );
							}
							onValueChange?.( next );
						} }
					/>
				) }
			/>
		);
	}
);
