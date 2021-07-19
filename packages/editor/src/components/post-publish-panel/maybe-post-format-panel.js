/**
 * WordPress dependencies
 */
import { Button, PanelBody } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { POST_FORMATS } from '../post-format';

const PostFormatSuggestion = ( { onApplySuggestion, suggestionText } ) => (
	<Button variant="link" onClick={ onApplySuggestion }>
		{ suggestionText }
	</Button>
);

export default function PostFormatPanel() {
	const suggestedFormat = useSelect( ( select ) => {
		const { getEditedPostAttribute, getSuggestedPostFormat } = select(
			editorStore
		);
		const potentialSuggestedFormatId = getSuggestedPostFormat();

		// If the suggested format isn't null, isn't already applied, and is
		// supported by the theme, return it. Otherwise, return null.
		if (
			potentialSuggestedFormatId &&
			potentialSuggestedFormatId !== getEditedPostAttribute( 'format' ) &&
			( select( coreStore ).getThemeSupports().formats ?? [] ).includes(
				potentialSuggestedFormatId
			)
		) {
			return POST_FORMATS.find(
				( { id } ) => id === potentialSuggestedFormatId
			);
		}
		return null;
	}, [] );

	const { editPost } = useDispatch( editorStore );

	if ( ! suggestedFormat ) {
		return null;
	}

	return (
		<PanelBody
			initialOpen={ false }
			title={
				<>
					{ __( 'Suggestion:' ) }
					<span className="editor-post-publish-panel__link">
						{ __( 'Use a post format' ) }
					</span>
				</>
			}
		>
			<p>
				{ __(
					'Your theme uses post formats to highlight different kinds of content, like images or videos. Apply a post format to see this special styling.'
				) }
			</p>
			<p>
				<PostFormatSuggestion
					onApplySuggestion={ () => {
						editPost( { format: suggestedFormat.id } );
					} }
					suggestionText={ sprintf(
						/* translators: %s: post format */
						__( 'Apply the "%1$s" format.' ),
						suggestedFormat.caption
					) }
				/>
			</p>
		</PanelBody>
	);
}
