import { Field as BaseField } from '@base-ui/react/field';
import { GregorianCalendar, parseDate } from '@internationalized/date';
import { useDateField, useDateSegment } from 'react-aria/useDateField';
import { I18nProvider, useLocale } from 'react-aria/I18nProvider';
import {
	useDateFieldState,
	type DateFieldState,
	type DateSegment,
} from 'react-stately/useDateFieldState';
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

const createCalendar = () => new GregorianCalendar();

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
		<span ref={ ref } { ...segmentProps } className={ styles.segment }>
			{ segment.text }
		</span>
	);
}

type ControlProps = React.ComponentPropsWithRef< 'input' >;

function Editor( {
	controlProps,
	value,
	onValueChange,
}: {
	controlProps: ControlProps;
	value: string | null;
	onValueChange: ( value: string | null ) => void;
} ) {
	const groupRef = useRef< HTMLDivElement >( null );
	const inputRef = useRef< HTMLInputElement >( null );
	const ref = useMergeRefs( [ controlProps.ref, inputRef ] );
	const { locale, direction } = useLocale();
	const date = useMemo(
		() => ( value ? parseDate( value ) : null ),
		[ value ]
	);
	const props = {
		value: date,
		onChange: ( next: typeof date ) =>
			onValueChange( next?.toString() ?? null ),
		isDisabled: controlProps.disabled,
		isReadOnly: controlProps.readOnly,
		isRequired: controlProps.required,
		isInvalid:
			controlProps[ 'aria-invalid' ] === true ||
			controlProps[ 'aria-invalid' ] === 'true',
		'aria-label':
			controlProps[ 'aria-label' ] ??
			( controlProps[ 'aria-labelledby' ] ? undefined : __( 'Date' ) ),
		'aria-labelledby': controlProps[ 'aria-labelledby' ],
		'aria-describedby': controlProps[ 'aria-describedby' ],
		validationBehavior: 'aria' as const,
	};
	const state = useDateFieldState( { ...props, locale, createCalendar } );
	const { fieldProps } = useDateField( props, state, groupRef );
	const segments = state.segments.filter( ( segment ) => segment.isEditable );
	const isPartial =
		segments.some( ( segment ) => segment.isPlaceholder ) &&
		segments.some( ( segment ) => ! segment.isPlaceholder );

	useIsomorphicLayoutEffect( () => {
		inputRef.current?.setCustomValidity(
			isPartial ? __( 'Enter a complete date.' ) : ''
		);
	}, [ isPartial ] );

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
						?.querySelector< HTMLElement >( '[tabindex="0"]' )
						?.focus();
				} }
			/>
			<div
				{ ...fieldProps }
				ref={ groupRef }
				dir={ direction }
				className={ styles.editor }
			>
				{ state.segments.map( ( segment, index ) => (
					<Segment
						key={ index }
						segment={ segment }
						state={ state }
					/>
				) ) }
			</div>
		</InputLayout>
	);
}

/**
 * Prototype: a segmented date editor registered through Base UI Field.Control.
 */
export const DateInput = forwardRef< HTMLInputElement, DateInputProps >(
	function UnforwardedDateInput(
		{ value, defaultValue = null, onValueChange, locale, ...props },
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
			<I18nProvider locale={ locale }>
				<BaseField.Control
					{ ...props }
					ref={ mergedRef }
					value={ currentValue ?? '' }
					render={ ( controlProps ) => (
						<Editor
							key={ resetKey }
							controlProps={ controlProps }
							value={ currentValue }
							onValueChange={ ( next ) => {
								if ( value === undefined ) {
									setUncontrolledValue( next );
								}
								onValueChange?.( next );
							} }
						/>
					) }
				/>
			</I18nProvider>
		);
	}
);
