/**
 * WordPress dependencies
 */
import { Button, __experimentalVStack as VStack } from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import { Notice } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../store';
import { saveContentGuidelines } from '../api';
import type { GuidelineAccordionFormProps } from '../types';

export default function GuidelineAccordionForm( {
	slug,
	contentId,
	headingId,
	descriptionId,
}: GuidelineAccordionFormProps ) {
	// @ts-ignore
	const { setGuideline } = useDispatch( STORE_NAME );
	const [ loading, setLoading ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	const { value } = useSelect(
		( select ) => ( {
			// @ts-ignore
			value: select( STORE_NAME ).getGuideline( slug ) as string,
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
			.then( () => setError( null ) )
			.catch( ( e: Error ) => setError( e.message ) )
			.finally( () => setLoading( false ) );
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
					<Notice.Root intent="error">
						<Notice.Title>
							{ sprintf(
								/* translators: %s: Error message. */
								__( 'Error saving guidelines: %s' ),
								error
							) }
						</Notice.Title>
					</Notice.Root>
				) }
				<Button
					variant="primary"
					type="submit"
					className="save-button"
					disabled={ loading }
				>
					{ __( 'Save guidelines' ) }
				</Button>
			</VStack>
		</form>
	);
}
