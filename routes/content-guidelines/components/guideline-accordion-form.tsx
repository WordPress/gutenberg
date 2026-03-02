/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalVStack as VStack,
	TextareaControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import type { FormEvent } from 'react';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../store';
import { saveContentGuidelines } from '../api';

interface GuidelineAccordionFormProps {
	slug: string;
	contentId?: string; // Used for a11y.
	headingId?: string; // Used for a11y.
	descriptionId?: string;
}

export default function GuidelineAccordionForm( {
	slug,
	contentId,
	headingId,
	descriptionId,
}: GuidelineAccordionFormProps ) {
	// @ts-ignore
	const { setGuideline } = useDispatch( STORE_NAME );

	const { value } = useSelect(
		( select ) => ( {
			// @ts-ignore
			value: select( STORE_NAME ).getGuideline( slug ) as string,
		} ),
		[ slug ]
	);

	const [ draft, setDraft ] = useState( value );

	const handleSave = ( event: FormEvent< HTMLFormElement > ) => {
		event.preventDefault();
		setGuideline( slug, draft );
		saveContentGuidelines();
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
				<TextareaControl
					label={ __( 'Copy guidelines' ) }
					hideLabelFromVision
					value={ draft }
					onChange={ setDraft }
				/>
				<Button variant="primary" type="submit" className="save-button">
					{ __( 'Save guidelines' ) }
				</Button>
			</VStack>
		</form>
	);
}
