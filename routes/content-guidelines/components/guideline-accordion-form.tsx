/* @jsxRuntime automatic */

/**
 * WordPress dependencies
 */
import {
	Button,
	Notice,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as coreContentGuidelinesStore } from '../store';
import { saveContentGuidelines } from '../api';
import type { GuidelineAccordionFormProps } from '../types';

export default function GuidelineAccordionForm( {
	slug,
	contentId,
	headingId,
	descriptionId,
}: GuidelineAccordionFormProps ) {
	const { setGuideline } = useDispatch( coreContentGuidelinesStore );
	const { createSuccessNotice } = useDispatch( noticesStore );
	const [ loading, setLoading ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );
	const [ showClearConfirmation, setShowClearConfirmation ] =
		useState( false );

	const { value } = useSelect(
		( select ) => ( {
			value: select( coreContentGuidelinesStore ).getGuideline( slug ),
		} ),
		[ slug ]
	);

	const [ draft, setDraft ] = useState( value );
	useEffect( () => setDraft( value ), [ value ] );

	const data = useMemo( () => ( { guidelines: draft } ), [ draft ] );

	const fields: Field< { guidelines: string } >[] = useMemo(
		() => [
			{
				id: 'guidelines',
				label: sprintf(
					/* translators: %s: Guideline category. */
					__( '%s guidelines' ),
					slug
				),
				type: 'text',
				Edit: 'textarea',
			},
		],
		[ slug ]
	);

	const form: Form = useMemo(
		() => ( {
			layout: { type: 'regular', labelPosition: 'none' },
			fields: [ 'guidelines' ],
		} ),
		[]
	);

	const handleSave = ( event: React.FormEvent< HTMLFormElement > ) => {
		event.preventDefault();
		setGuideline( slug, draft );
		setLoading( true );
		saveContentGuidelines()
			.then( () => {
				setError( null );
				createSuccessNotice( __( 'Guidelines saved.' ), {
					type: 'snackbar',
				} );
			} )
			.catch( ( e: Error ) =>
				setError(
					sprintf(
						/* translators: %s: Error message. */
						__( 'Error saving guidelines: %s' ),
						e.message
					)
				)
			)
			.finally( () => setLoading( false ) );
	};

	const handleClearClick = () => setShowClearConfirmation( true );

	const handleClearConfirm = () => {
		const oldValue = draft;

		// We need to pass an empty string to remove the guideline.
		// This is because the API will only remove the guideline if the value is an empty string.
		setGuideline( slug, '' );
		setLoading( true );
		saveContentGuidelines()
			.then( () => {
				setError( null );
				createSuccessNotice( __( 'Guidelines cleared.' ), {
					type: 'snackbar',
				} );
			} )
			.catch( ( e: Error ) => {
				setError(
					sprintf(
						/* translators: %s: Error message. */
						__( 'Error clearing guidelines: %s' ),
						e.message
					)
				);
				setGuideline( slug, oldValue );
			} )
			.finally( () => {
				setLoading( false );
				setShowClearConfirmation( false );
			} );
	};

	return (
		<form
			id={ contentId }
			aria-labelledby={ headingId }
			aria-describedby={ descriptionId }
			onSubmit={ handleSave }
			className="content-guidelines__accordion-form"
		>
			<VStack spacing={ 4 }>
				<DataForm
					data={ data }
					fields={ fields }
					form={ form }
					onChange={ ( edits ) =>
						setDraft( edits.guidelines ?? draft )
					}
				/>
				{ error && (
					<Notice status="error" onRemove={ () => setError( null ) }>
						{ error }
					</Notice>
				) }
				<HStack spacing={ 4 } alignment="left">
					<Button
						variant="primary"
						type="submit"
						className="save-button"
						disabled={ loading || ! draft }
						accessibleWhenDisabled
						isBusy={ loading }
					>
						{ __( 'Save guidelines' ) }
					</Button>
					<Button
						variant="tertiary"
						type="button"
						disabled={ loading || ! value }
						accessibleWhenDisabled
						isBusy={ loading }
						onClick={ handleClearClick }
					>
						{ __( 'Clear guidelines' ) }
					</Button>
				</HStack>
			</VStack>
			<ConfirmDialog
				isOpen={ showClearConfirmation }
				title={ sprintf(
					/* translators: %s: Guideline category. */
					__( 'Clear %s guidelines' ),
					slug
				) }
				__experimentalHideHeader={ false }
				onConfirm={ handleClearConfirm }
				onCancel={ () => setShowClearConfirmation( false ) }
				confirmButtonText={ __( 'Clear guidelines' ) }
				isBusy={ loading }
				size="small"
			>
				{ sprintf(
					/* translators: %s: Guideline category slug. */
					__(
						'You are about to clear the %s guidelines. This can be undone from revision history.'
					),
					slug
				) }
			</ConfirmDialog>
		</form>
	);
}
