import { mergeProps, useRender } from '@base-ui/react';
import { __ } from '@wordpress/i18n';
import {
	cloneElement,
	forwardRef,
	useEffect,
	useId,
	useRef,
	useState,
} from '@wordpress/element';
import type { ControlWithErrorProps, ValidityTarget } from './types';
import { Stack } from '../../../stack';
import { ValidityIndicator } from '../validity-indicator';

const DEFAULT_RENDER = ( props: React.ComponentProps< typeof Stack > ) => (
	<Stack { ...props } direction="column" gap="sm" />
);

function appendRequiredIndicator(
	label: React.ReactNode,
	required: boolean | undefined,
	markWhenOptional: boolean | undefined
) {
	let suffix;
	if ( required && ! markWhenOptional ) {
		suffix = `(${ __( 'Required' ) })`;
	} else if ( ! required && markWhenOptional ) {
		suffix = `(${ __( 'Optional' ) })`;
	}

	if ( ! suffix ) {
		return label;
	}

	if ( typeof label === 'string' ) {
		return `${ label } ${ suffix }`;
	}

	return (
		<>
			{ label } { suffix }
		</>
	);
}

const VALIDITY_VISIBLE_ATTRIBUTE = 'data-validity-visible';

/**
 * A wrapper that adds inline validation feedback to a form control, based on
 * the native Constraint Validation API.
 *
 * The wrapped control is cloned with `label` and `required` props, and the
 * validity state is read from the element returned by `getValidityTarget`.
 * Validation messages become visible once the control has been touched
 * (blurred at least once), when the enclosing form is submitted, or when an
 * `invalid` event is dispatched on the validity target.
 */
export const ControlWithError = forwardRef<
	HTMLDivElement,
	ControlWithErrorProps
>( function ControlWithError(
	{
		required,
		markWhenOptional,
		customValidity,
		getValidityTarget,
		children,
		render = DEFAULT_RENDER,
		...restProps
	},
	forwardedRef
) {
	const [ errorMessage, setErrorMessage ] = useState< string | undefined >();
	const [ statusMessage, setStatusMessage ] = useState<
		| {
				type: 'validating' | 'valid';
				message?: string;
		  }
		| undefined
	>();
	const [ showMessage, setShowMessage ] = useState( false );
	const [ isTouched, setIsTouched ] = useState( false );

	const wrapperRef = useRef< HTMLDivElement >( null );

	// Ensure that error messages are visible when an `invalid` event is triggered,
	// e.g. when a form is submitted or reportValidity() is called.
	useEffect( () => {
		const validityTarget = getValidityTarget();
		const handler = () => {
			// Re-read the message: the target's validity may have changed
			// since it was last sampled, without a re-render in between.
			// While async validation is pending, keep its indicator instead
			// of showing a message its result may supersede.
			if ( customValidity?.type !== 'validating' ) {
				setErrorMessage( validityTarget?.validationMessage );
			}
			setShowMessage( true );
			validityTarget?.setAttribute( VALIDITY_VISIBLE_ATTRIBUTE, '' );
		};

		validityTarget?.addEventListener( 'invalid', handler );
		return () => validityTarget?.removeEventListener( 'invalid', handler );
	}, [ customValidity?.type, getValidityTarget ] );

	// Suppress the native error popover, while keeping the focus behavior intact.
	useEffect( () => {
		const validityTarget = getValidityTarget();

		const suppressNativePopover = ( event: Event ) => {
			event.preventDefault();

			// Only trusted `invalid` events (a form submission or a
			// `reportValidity()` call) mirror the native focus behavior.
			// Consumers may dispatch a synthetic `invalid` event to reveal
			// this control's error message without disturbing the user's
			// place in the form, so it must not move focus.
			if ( ! event.isTrusted ) {
				return;
			}

			const target = event.target as ValidityTarget;
			const firstErrorInForm = Array.from(
				target.form?.elements ?? []
			).find( ( el ) => ! ( el as ValidityTarget ).validity.valid );

			if ( ! target.form || firstErrorInForm === target ) {
				target.focus();
			}
		};

		// Radio inputs need special handling because all radio inputs with the
		// same `name` will be marked as invalid. Without this handling, the last radio option
		// will be focused with an unsuppressed native popover.
		const radioSiblings =
			validityTarget?.type === 'radio' && validityTarget?.name
				? Array.from(
						wrapperRef.current?.querySelectorAll< HTMLInputElement >(
							`input[type="radio"][name="${ validityTarget?.name }"]`
						) ?? []
				  ).filter( ( sibling ) => sibling !== validityTarget )
				: [];

		validityTarget?.addEventListener( 'invalid', suppressNativePopover );
		radioSiblings.forEach( ( sibling ) =>
			sibling.addEventListener( 'invalid', suppressNativePopover )
		);

		return () => {
			validityTarget?.removeEventListener(
				'invalid',
				suppressNativePopover
			);
			radioSiblings.forEach( ( sibling ) =>
				sibling.removeEventListener( 'invalid', suppressNativePopover )
			);
		};
	}, [ getValidityTarget ] );

	// Handle validity messages.
	useEffect( () => {
		const validityTarget = getValidityTarget();

		if ( ! customValidity?.type ) {
			validityTarget?.setCustomValidity( '' );
			setErrorMessage( validityTarget?.validationMessage );
			setStatusMessage( undefined );
			return;
		}

		switch ( customValidity.type ) {
			case 'validating': {
				validityTarget?.setCustomValidity( '' );
				setErrorMessage( undefined );

				setStatusMessage( {
					type: 'validating',
					message: customValidity.message,
				} );
				break;
			}
			case 'valid': {
				validityTarget?.setCustomValidity( '' );
				setErrorMessage( validityTarget?.validationMessage );

				setStatusMessage( {
					type: 'valid',
					message: customValidity.message,
				} );
				break;
			}
			case 'invalid': {
				validityTarget?.setCustomValidity(
					customValidity.message ?? ''
				);
				setErrorMessage( validityTarget?.validationMessage );

				setStatusMessage( undefined );
				break;
			}
		}
	}, [ customValidity, getValidityTarget ] );

	// Show messages if field has been touched (i.e. has blurred at least once),
	// or validation has been triggered by the consumer/user.
	useEffect( (): ReturnType< React.EffectCallback > => {
		if ( ! isTouched || showMessage ) {
			return;
		}

		if ( customValidity?.type === 'validating' ) {
			// Don't show validating indicators for quick calls that take less than 1 sec.
			const timer = setTimeout( () => {
				setShowMessage( true );
			}, 1000 );

			return () => clearTimeout( timer );
		}

		setShowMessage( true );
	}, [ isTouched, customValidity?.type, showMessage ] );

	// Mark blurred fields as touched.
	const onBlur = ( event: React.FocusEvent< HTMLDivElement > ) => {
		if ( isTouched ) {
			return;
		}

		// Only consider "blurred from the component" if focus has fully left the wrapping div.
		// This prevents unnecessary blurs from components with multiple focusable elements.
		if (
			! event.relatedTarget ||
			! event.currentTarget.contains( event.relatedTarget )
		) {
			setIsTouched( true );
			getValidityTarget()?.setAttribute( VALIDITY_VISIBLE_ATTRIBUTE, '' );
		}
	};

	const messageId = useId();

	const message = ( () => {
		if ( errorMessage ) {
			return (
				<ValidityIndicator
					id={ messageId }
					type="invalid"
					message={ errorMessage }
				/>
			);
		}
		if ( statusMessage?.type ) {
			return (
				<ValidityIndicator
					id={ messageId }
					type={ statusMessage.type }
					message={ statusMessage.message }
				/>
			);
		}
		return null;
	} )();

	const visibleMessage = showMessage ? message : null;

	// Imperatively manage `aria-describedby` on the validity target so we
	// merge with any value the child control sets internally (e.g. from a
	// `help` prop), rather than competing with it at the props level.
	useEffect( () => {
		const target = getValidityTarget();
		if ( ! target ) {
			return;
		}

		function setDescribedBy( el: Element, shouldAdd: boolean ) {
			const ids = ( el.getAttribute( 'aria-describedby' ) ?? '' )
				.split( ' ' )
				.filter( ( id ) => id && id !== messageId );

			if ( shouldAdd ) {
				ids.push( messageId );
			}

			if ( ids.length ) {
				el.setAttribute( 'aria-describedby', ids.join( ' ' ) );
			} else {
				el.removeAttribute( 'aria-describedby' );
			}
		}

		setDescribedBy( target, !! visibleMessage );

		return () => setDescribedBy( target, false );
	}, [ visibleMessage, messageId, getValidityTarget ] );

	return useRender( {
		render,
		ref: [ forwardedRef, wrapperRef ],
		props: mergeProps< 'div' >( restProps, {
			onBlur,
			children: (
				<>
					{ cloneElement( children, {
						label: appendRequiredIndicator(
							children.props.label,
							required,
							markWhenOptional
						),
						required,
					} ) }
					{ visibleMessage }
				</>
			),
		} ),
	} );
} );
