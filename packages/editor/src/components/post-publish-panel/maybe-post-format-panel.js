/**
 * External dependencies
 */
import { find, get, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button, PanelBody } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { POST_FORMATS } from '../post-format';

const getSuggestion = ( supportedFormats, suggestedPostFormat ) => {
	const formats = POST_FORMATS.filter( ( format ) =>
		includes( supportedFormats, format.id )
	);
	return find( formats, ( format ) => format.id === suggestedPostFormat );
};

const PostFormatSuggestion = ( {
	suggestedPostFormat,
	suggestionText,
	onUpdatePostFormat,
} ) => (
	<Button
		variant="link"
		onClick={ () => onUpdatePostFormat( suggestedPostFormat ) }
	>
		{ suggestionText }
	</Button>
);

export default function PostFormatPanel() {
	const { currentPostFormat, suggestion } = useSelect( ( select ) => {
		const { getEditedPostAttribute, getSuggestedPostFormat } = select(
			'core/editor'
		);
		const supportedFormats = get(
			select( 'core' ).getThemeSupports(),
			[ 'formats' ],
			[]
		);
		return {
			currentPostFormat: getEditedPostAttribute( 'format' ),
			suggestion: getSuggestion(
				supportedFormats,
				getSuggestedPostFormat()
			),
		};
	}, [] );

	const { editPost } = useDispatch( 'core/editor' );

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
