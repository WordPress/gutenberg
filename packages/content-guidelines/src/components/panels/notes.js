/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { PanelBody, TextareaControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../store';

/**
 * Notes panel.
 *
 * @return {JSX.Element} Panel component.
 */
export default function NotesPanel() {
	const notes = useSelect(
		( select ) => select( STORE_NAME ).getNotes() || '',
		[]
	);

	const { updateDraft } = useDispatch( STORE_NAME );

	const handleChange = ( value ) => {
		updateDraft( { notes: value } );
	};

	return (
		<PanelBody
			title={ __( 'Notes', 'content-guidelines' ) }
			initialOpen={ false }
		>
			<TextareaControl
				label={ __( 'Anything else AI should know', 'content-guidelines' ) }
				help={ __(
					'Free-form notes, context, or reminders that don\'t fit elsewhere.',
					'content-guidelines'
				) }
				value={ notes }
				onChange={ handleChange }
				rows={ 5 }
				placeholder={ __(
					'e.g., "We\'re rebranding in Q2, so avoid old product names..."',
					'content-guidelines'
				) }
			/>
		</PanelBody>
	);
}
