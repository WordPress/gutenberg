/**
 * WordPress dependencies
 */
import { Button, PanelBody } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { POST_FORMATS } from '../post-format';
import { store as editorStore } from '../../store';

const getSuggestion = ( supportedFormats, suggestedPostFormat ) => {
	const formats = POST_FORMATS.filter( ( format ) =>
		supportedFormats?.includes( format.id )
	);
	return formats.find( ( format ) => format.id === suggestedPostFormat );
};

const PostFormatSuggestion = ( {
	suggestedPostFormat,
	suggestionText,
	onUpdatePostFormat,
} ) => (
	<Button
		__next40pxDefaultSize
		variant="link"
		onClick={ () => onUpdatePostFormat( suggestedPostFormat ) }
	>
		{ suggestionText }
	</Button>
);

export default function PostFormatPanel() {
	const { currentPostFormat, suggestion } = useSelect( ( select ) => {
		const { getEditedPostAttribute, getSuggestedPostFormat } =
			select( editorStore );
		const supportedFormats =
			select( coreStore ).getThemeSupports().formats ?? [];
		return {
			currentPostFormat: getEditedPostAttribute( 'format' ),
			suggestion: getSuggestion(
				supportedFormats,
				getSuggestedPostFormat()
			),
		};
	}, [] );

	const { editPost } = useDispatch( editorStore );

	const onUpdatePostFormat = ( format ) => editPost( { format } );

	const panelBodyTitle = [
		__( 'Suggestion:' ),
		<span className="editor-post-publish-panel__link" key="label">
			{ __( 'Use a post format' ) }
		</span>,
	];

	if ( ! suggestion || suggestion.id === currentPostFormat ) {
		return null;
	}

	return (
		<PanelBody initialOpen={ false } title={ panelBodyTitle }>
			<p>
				{ __(
					'Your theme uses post formats to highlight different kinds of content, like images or videos. Apply a post format to see this special styling.'
				) }
			</p>
			<p>
				<PostFormatSuggestion
					onUpdatePostFormat={ onUpdatePostFormat }
					suggestedPostFormat={ suggestion.id }
					suggestionText={ sprintf(
						/* translators: %s: post format */
						__( 'Apply the "%1$s" format.' ),
						suggestion.caption
					) }
				/>
			</p>
		</PanelBody>
	);
}
