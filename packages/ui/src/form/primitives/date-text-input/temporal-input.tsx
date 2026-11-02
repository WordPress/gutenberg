import { useRender } from '@base-ui/react/use-render';
import {
	forwardRef,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from '@wordpress/element';
import { useEvent, useMergeRefs } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown } from '@wordpress/icons';
import { VisuallyHidden } from '../../../visually-hidden';
import { Input } from '../input';
import { Button } from '../../../button';
import * as Popover from '../../../popover';
import type { TextValueProps, DateInputChangeDetails } from './types';
import type { InputProps } from '../input/types';
import styles from './style.module.css';

const NativeEditor = forwardRef<
	HTMLInputElement,
	React.ComponentPropsWithoutRef< 'input' > & {
		consumerRender: InputProps[ 'render' ];
		calendarButton: boolean;
		formatDescription: string;
		onDisable: () => void;
	}
>( function UnforwardedNativeEditor(
	{
		consumerRender,
		calendarButton,
		formatDescription,
		onDisable,
		...nativeProps
	},
	ref
) {
	const formatId = useId();
	const triggerId = useId();
	useEffect( () => {
		if ( nativeProps.disabled || nativeProps.readOnly ) {
			onDisable();
		}
	}, [ nativeProps.disabled, nativeProps.readOnly, onDisable ] );
	const input = useRender( {
		defaultTagName: 'input',
		render: consumerRender,
		ref,
		props: {
			...nativeProps,
			'aria-describedby': [ nativeProps[ 'aria-describedby' ], formatId ]
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
			{ calendarButton && (
				<Popover.Trigger
					disabled={ nativeProps.disabled || nativeProps.readOnly }
					aria-labelledby={
						nativeProps[ 'aria-labelledby' ]
							? `${ triggerId } ${ nativeProps[ 'aria-labelledby' ] }`
							: undefined
					}
					aria-label={
						nativeProps[ 'aria-label' ]
							? sprintf(
									/* translators: %s: Input label. */ __(
										'Choose date for %s'
									),
									nativeProps[ 'aria-label' ]
								)
							: __( 'Choose date' )
					}
					render={
						<Button
							variant="minimal"
							tone="neutral"
							size="small"
							focusableWhenDisabled={ false }
						/>
					}
				>
					<VisuallyHidden id={ triggerId }>
						{ __( 'Choose date for' ) }
					</VisuallyHidden>
					<Button.Icon icon={ chevronDown } />
				</Popover.Trigger>
			) }
		</>
	);
} );

interface Props< T > extends TextValueProps< T > {
	inputRef: React.Ref< HTMLInputElement >;
	formatDescription: string;
	parse: ( text: string ) => T | null | undefined;
	serialize: ( value: T | null ) => string;
	getError: ( text: string ) => string;
	calendar?: (
		value: T | null,
		select: ( value: T | null, event: React.SyntheticEvent ) => void
	) => React.ReactNode;
}

/** Shared native text-field behavior. No field registration or validation state is duplicated. */
export function TemporalInput< T >( {
	value,
	defaultValue = null,
	onValueChange,
	parse,
	serialize,
	getError,
	inputRef,
	formatDescription,
	calendar,
	render,
	readOnly,
	...props
}: Props< T > ) {
	const [ uncontrolledValue, setUncontrolledValue ] =
		useState( defaultValue );
	const currentValue = value === undefined ? uncontrolledValue : value;
	const key = serialize( currentValue );
	const [ draft, setDraft ] = useState( { key, text: key } );
	let text = draft.text;
	if ( draft.key !== key ) {
		text = key;
		setDraft( { key, text } );
	}
	const parsed = parse( text );
	if ( parsed !== undefined && serialize( parsed ) !== key ) {
		text = key;
		setDraft( { key, text } );
	}
	const error = getError( text );
	const nativeRef = useRef< HTMLInputElement >( null );
	const validityRef = useCallback(
		( element: HTMLInputElement | null ) => {
			element?.setCustomValidity( error );
		},
		[ error ]
	);
	const ref = useMergeRefs( [ nativeRef, inputRef, validityRef ] );
	const [ open, setOpen ] = useState( false );
	const closeCalendar = useCallback( () => setOpen( false ), [] );

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
				const nextKey = serialize( next );
				setDraft( { key: nextKey, text: nextKey } );
				setOpen( false );
			} );
		form?.addEventListener( 'reset', reset );
		return () => form?.removeEventListener( 'reset', reset );
	}, [ value, defaultValue, serialize, props.form ] );

	function update(
		nextText: string,
		event: Event,
		reason: DateInputChangeDetails[ 'reason' ]
	) {
		const nextValue = parse( nextText );
		let canceled = false;
		if ( nextValue !== undefined && serialize( nextValue ) !== key ) {
			onValueChange?.( nextValue, {
				event,
				reason,
				cancel: () => {
					canceled = true;
				},
				get isCanceled() {
					return canceled;
				},
			} );
			if ( canceled ) {
				setDraft( { key, text: key } );
				return false;
			}
			if ( value === undefined ) {
				setUncontrolledValue( nextValue );
			}
		}
		setDraft( { key, text: nextText } );
		return true;
	}

	const onCalendarSelect = useEvent(
		( next: T | null, event: React.SyntheticEvent ) => {
			if ( readOnly || nativeRef.current?.matches( ':disabled' ) ) {
				return;
			}
			if (
				update(
					serialize( next ),
					event.nativeEvent,
					'calendar-selection'
				) &&
				! getError( serialize( next ) )
			) {
				setOpen( false );
			}
		}
	);

	const input = (
		<Input
			{ ...props }
			ref={ ref }
			type="text"
			dir="ltr"
			readOnly={ readOnly }
			value={ text }
			onValueChange={ ( next, details ) => {
				if ( ! update( next, details.event, 'input-change' ) ) {
					details.cancel();
				}
			} }
			render={ ( nativeProps ) => (
				<NativeEditor
					{ ...nativeProps }
					consumerRender={ render }
					formatDescription={ formatDescription }
					calendarButton={ !! calendar }
					onDisable={ closeCalendar }
				/>
			) }
		/>
	);
	if ( ! calendar ) {
		return input;
	}
	return (
		<Popover.Root open={ open } onOpenChange={ setOpen }>
			{ input }
			<Popover.Popup className={ styles.popup } finalFocus={ nativeRef }>
				<VisuallyHidden render={ <Popover.Title /> }>
					{ __( 'Choose date' ) }
				</VisuallyHidden>
				{ calendar( currentValue, onCalendarSelect ) }
			</Popover.Popup>
		</Popover.Root>
	);
}
