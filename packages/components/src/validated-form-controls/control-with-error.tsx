/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	cloneElement,
	forwardRef,
	useEffect,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ValidatedControlProps } from './components/types';
import { ValidityIndicator } from './validity-indicator';

function appendRequiredIndicator(
	label: React.ReactNode,
	required: boolean | undefined,
	markWhenOptional: boolean | undefined
) {
	if ( required && ! markWhenOptional ) {
		return (
			<>
				{ label } { `(${ __( 'Required' ) })` }
			</>
		);
	}
	if ( ! required && markWhenOptional ) {
		return (
			<>
				{ label } { `(${ __( 'Optional' ) })` }
			</>
		);
	}
	return label;
}

const VALIDITY_VISIBLE_ATTRIBUTE = 'data-validity-visible';
const className = 'components-validated-control';

/**
 * HTML elements that support the Constraint Validation API.
 *
 * Here, we exclude HTMLButtonElement because although it does technically support the API,
 * normal buttons are actually exempted from any validation.
 * @see https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLButtonElement/willValidate
 */
type ValidityTarget =
	| HTMLFieldSetElement
	| HTMLInputElement
	| HTMLSelectElement
	| HTMLTextAreaElement;

function UnforwardedControlWithError< C extends React.ReactElement >(
	{
		required,
		markWhenOptional,
		customValidity,
		getValidityTarget,
		children,
	}: {
		/**
		 * Whether the control is required.
		 */
		required?: boolean;
		/**
		 * Label the control as "optional" when _not_ `required`, instead of the inverse.
		 */
		markWhenOptional?: boolean;
		customValidity?: ValidatedControlProps[ 'customValidity' ];
		/**
		 * A function that returns the actual element on which the validity data should be applied.
		 */
		getValidityTarget: () => ValidityTarget | null | undefined;
		/**
		 * The control component to apply validation to.
		 *
		 * As `children` will be cloned with additional props,
		 * the component at the root of `children` should accept
		 * `label`, `onChange`, and `required` props, and process them
		 * appropriately.
		 */
		children: C;
	},
	forwardedRef: React.ForwardedRef< HTMLDivElement >
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

	// Ensure that error messages are visible when an `invalid` event is triggered,
	// e.g. when a form is submitted or reportValidity() is called.
	useEffect( () => {
		const validityTarget = getValidityTarget();
		const handler = () => {
			setShowMessage( true );
			validityTarget?.setAttribute( VALIDITY_VISIBLE_ATTRIBUTE, '' );
		};

		validityTarget?.addEventListener( 'invalid', handler );
		return () => validityTarget?.removeEventListener( 'invalid', handler );
	}, [ getValidityTarget ] );

	// Suppress the native error popover, while keeping the focus behavior intact.
	useEffect( () => {
		const validityTarget = getValidityTarget();

		const suppressNativePopover = ( event: Event ) => {
			event.preventDefault();

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
		const radioSibilings =
			validityTarget?.type === 'radio' && validityTarget?.name
				? Array.from(
						validityTarget
							?.closest( `.${ className }` )
							?.querySelectorAll< HTMLInputElement >(
								`input[type="radio"][name="${ validityTarget?.name }"]`
							) ?? []
				  ).filter( ( sibling ) => sibling !== validityTarget )
				: [];

		validityTarget?.addEventListener( 'invalid', suppressNativePopover );
		radioSibilings.forEach( ( sibling ) =>
			sibling.addEventListener( 'invalid', suppressNativePopover )
		);

		return () => {
			validityTarget?.removeEventListener(
				'invalid',
				suppressNativePopover
			);
			radioSibilings.forEach( ( sibling ) =>
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

	const message = () => {
		if ( errorMessage ) {
			return (
				<ValidityIndicator type="invalid" message={ errorMessage } />
			);
		}
		if ( statusMessage?.type ) {
			return (
				<ValidityIndicator
					type={ statusMessage.type }
					message={ statusMessage.message }
				/>
			);
		}
		return null;
	};

	return (
		<div className={ className } ref={ forwardedRef } onBlur={ onBlur }>
			{ cloneElement( children, {
				label: appendRequiredIndicator(
					children.props.label,
					required,
					markWhenOptional
				),
				required,
			} ) }
			<div aria-live="polite">{ showMessage && message() }</div>
		</div>
	);
}

export const ControlWithError = forwardRef( UnforwardedControlWithError );
ControlWithError.displayName = 'ControlWithError';
