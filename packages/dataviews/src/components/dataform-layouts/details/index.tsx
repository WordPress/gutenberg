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
import { Badge } from '@wordpress/ui';
import { sprintf, _n, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type {
	FieldValidity,
	NormalizedForm,
	NormalizedDetailsLayout,
	FieldLayoutProps,
} from '../../../types';
import DataFormContext from '../../dataform-context';
import { DataFormLayout } from '../data-form-layout';
import { DEFAULT_LAYOUT } from '../normalize-form';
import useReportValidity from '../../../hooks/use-report-validity';

function countInvalidFields( validity: FieldValidity | undefined ): number {
	if ( ! validity ) {
		return 0;
	}

	let count = 0;
	const validityRules = Object.keys( validity ).filter(
		( key ) => key !== 'children'
	);

	for ( const key of validityRules ) {
		const rule = validity[ key as keyof Omit< FieldValidity, 'children' > ];
		if ( rule?.type === 'invalid' ) {
			count++;
		}
	}

	// Count children recursively
	if ( validity.children ) {
		for ( const childValidity of Object.values( validity.children ) ) {
			count += countInvalidFields( childValidity );
		}
	}

	return count;
}

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

	// Count invalid fields for validation badge
	const invalidCount = countInvalidFields( validity );
	const showValidationBadge = touched && invalidCount > 0;

	const validationBadge = showValidationBadge ? (
		<Badge intent="high">
			{ sprintf(
				/* translators: %d: Number of fields that need attention */
				_n(
					'%d field needs attention',
					'%d fields need attention',
					invalidCount
				),
				invalidCount
			) }
		</Badge>
	) : null;

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
				<span className="dataforms-layouts-details__summary-content">
					{ summaryContent }
					{ validationBadge }
				</span>
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
