/* @jsx createElement */

/**
 * WordPress dependencies
 */
import {
	Button,
	Notice,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import { __, sprintf } from '@wordpress/i18n';
import {
	createElement,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

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
	const { createSuccessNotice } = useDispatch( noticesStore );
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
			.then( () => {
				setError( null );
				createSuccessNotice( __( 'Guidelines saved.' ), {
					type: 'snackbar',
				} );
			} )
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
					<Notice status="error" onRemove={ () => setError( null ) }>
						{ sprintf(
							/* translators: %s: Error message. */
							__( 'Error saving guidelines: %s' ),
							error
						) }
					</Notice>
				) }
				<Button
					variant="primary"
					type="submit"
					className="save-button"
					disabled={ loading }
					accessibleWhenDisabled
					isBusy={ loading }
				>
					{ __( 'Save guidelines' ) }
				</Button>
			</VStack>
		</form>
	);
}
