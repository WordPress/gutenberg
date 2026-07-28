/**
 * WordPress dependencies
 */
import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type {
	NormalizedForm,
	NormalizedDetailsLayout,
	FieldLayoutProps,
} from '../../../types';
import DataFormContext from '../../dataform-context';
import { DataFormLayout } from '../data-form-layout';
import { DEFAULT_LAYOUT } from '../normalize-form';
import useReportValidity from '../../../hooks/use-report-validity';
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

	// When expanded after being touched, trigger reportValidity to show
	// field-level errors.
	useReportValidity( contentRef, isOpen && touched );

	// Mark as touched when any field inside is blurred.
	const handleBlur = useCallback( () => {
		setTouched( true );
	}, [] );

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
				onBlur={ handleBlur }
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
