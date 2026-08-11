import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { __experimentalUseFocusOutside as useFocusOutside } from '@wordpress/compose';
import { Stack } from '@wordpress/ui';
import type {
	NormalizedForm,
	NormalizedDetailsLayout,
	FieldLayoutProps,
} from '../../../types';
import DataFormContext from '../../dataform-context';
import { DataFormLayout } from '../data-form-layout';
import { DEFAULT_LAYOUT } from '../normalize-form';
import getValidationMessage from '../get-validation-message';
import useRevealValidity from '../../../hooks/use-reveal-validity';
import ValidationBadge from '../validation-badge';

export default function FormDetailsField< Item >( {
	data,
	field,
	onChange,
	validity,
}: FieldLayoutProps< Item > ) {
	const { fields } = useContext( DataFormContext );
	const detailsRef = useRef< HTMLDetailsElement >( null );
	const contentRef = useRef< HTMLDivElement >( null );
	const hasFocusedContentRef = useRef( false );
	const [ touched, setTouched ] = useState( false );
	const [ isOpen, setIsOpen ] = useState( false );

	const form: NormalizedForm = useMemo(
		() => ( {
			layout: DEFAULT_LAYOUT,
			fields: field.children ?? [],
		} ),
		[ field ]
	);

	// Track the open/close state of the native details element.
	useEffect( () => {
		const details = detailsRef.current;
		if ( ! details ) {
			return;
		}

		const handleToggle = () => {
			const nowOpen = details.open;
			// Mark as touched when collapsing (going from open to closed).
			if ( ! nowOpen ) {
				setTouched( true );
			}
			setIsOpen( nowOpen );
		};

		details.addEventListener( 'toggle', handleToggle );
		return () => {
			details.removeEventListener( 'toggle', handleToggle );
		};
	}, [] );

	// When expanded after being touched, reveal the field-level errors.
	const revealValidity = useRevealValidity( contentRef, isOpen && touched );

	const handleContentFocus = useCallback( () => {
		hasFocusedContentRef.current = true;
	}, [] );

	// Reveal the errors of every field once focus leaves the details element,
	// replicating at the container level how validated controls show errors on
	// their first blur. Moving focus between fields within it doesn't count,
	// so the natural tab sequence is preserved.
	const handleFocusOutside = useCallback( () => {
		// Leaving without ever entering the fields — for instance tabbing past
		// the summary while collapsed — isn't an interaction to report on.
		if ( ! hasFocusedContentRef.current ) {
			return;
		}
		setTouched( true );
		// A closed details element reveals nothing: its content is hidden but
		// still in the DOM, so the reveal would count the invalid fields and
		// announce them. The summary badge already conveys them, and
		// reopening the element reveals the errors through the effect above.
		// The DOM is read directly because the `isOpen` state trails it while
		// the `toggle` event is still in flight.
		if ( ! detailsRef.current?.open ) {
			return;
		}
		// The errors appear without moving focus, so announce them: their
		// arrival is otherwise imperceptible to assistive technology.
		const revealedCount = revealValidity();
		const message = getValidationMessage( validity );
		if ( revealedCount > 0 && message ) {
			speak( message, 'polite' );
		}
	}, [ revealValidity, validity ] );

	const focusOutsideProps = useFocusOutside( handleFocusOutside );

	if ( ! field.children ) {
		return null;
	}

	// Find the summary field definition if specified
	const summaryFieldId =
		( field.layout as NormalizedDetailsLayout ).summary ?? '';
	const summaryField = summaryFieldId
		? fields.find( ( fieldDef ) => fieldDef.id === summaryFieldId )
		: undefined;

	// Render the summary content
	let summaryContent;
	if ( summaryField && summaryField.render ) {
		// Use the field's render function to display the current value
		summaryContent = (
			<summaryField.render item={ data } field={ summaryField } />
		);
	} else {
		// Fall back to the label
		summaryContent = field.label || __( 'More details' );
	}

	return (
		<details
			ref={ detailsRef }
			className="dataforms-layouts-details__details"
			{ ...focusOutsideProps }
		>
			<summary className="dataforms-layouts-details__summary">
				<Stack
					direction="row"
					align="center"
					gap="md"
					className="dataforms-layouts-details__summary-content"
				>
					{ summaryContent }
					{ touched && <ValidationBadge validity={ validity } /> }
				</Stack>
			</summary>
			<div
				ref={ contentRef }
				className="dataforms-layouts-details__content"
				onFocus={ handleContentFocus }
			>
				<DataFormLayout
					data={ data }
					form={ form }
					onChange={ onChange }
					validity={ validity?.children }
				/>
			</div>
		</details>
	);
}
