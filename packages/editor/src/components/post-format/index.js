/**
 * External dependencies
 */
import { union } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button, SelectControl } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import PostFormatCheck from './check';

// All WP post formats, sorted alphabetically by translated name.
export const POST_FORMATS = [
	{ id: 'aside', caption: __( 'Aside' ) },
	{ id: 'audio', caption: __( 'Audio' ) },
	{ id: 'chat', caption: __( 'Chat' ) },
	{ id: 'gallery', caption: __( 'Gallery' ) },
	{ id: 'image', caption: __( 'Image' ) },
	{ id: 'link', caption: __( 'Link' ) },
	{ id: 'quote', caption: __( 'Quote' ) },
	{ id: 'standard', caption: __( 'Standard' ) },
	{ id: 'status', caption: __( 'Status' ) },
	{ id: 'video', caption: __( 'Video' ) },
].sort( ( a, b ) => {
	const normalizedA = a.caption.toUpperCase();
	const normalizedB = b.caption.toUpperCase();

	if ( normalizedA < normalizedB ) {
		return -1;
	}
	if ( normalizedA > normalizedB ) {
		return 1;
	}
	return 0;
} );

export default function PostFormat() {
	const instanceId = useInstanceId( PostFormat );
	const postFormatSelectorId = `post-format-selector-${ instanceId }`;

	const { currentFormatId, listedFormats, suggestedFormat } = useSelect(
		( select ) => {
			const supportedFormatIds =
				select( coreStore ).getThemeSupports().formats ?? [];
			const { getEditedPostAttribute, getSuggestedPostFormat } = select(
				editorStore
			);
			const _currentFormatId =
				getEditedPostAttribute( 'format' ) ?? 'standard';

			const potentialSuggestedFormatId = getSuggestedPostFormat();

			// If the suggested format isn't null, isn't already applied, and is
			// supported by the theme, return it. Otherwise, return null.
			const suggestionIsValid =
				potentialSuggestedFormatId &&
				potentialSuggestedFormatId !== _currentFormatId &&
				supportedFormatIds.includes( potentialSuggestedFormatId );

			// The current format may not be supported by the theme.
			// Ensure it is always shown in the select control.
			const currentOrSupportedFormatIds = union(
				[ _currentFormatId ],
				supportedFormatIds
			);

			return {
				currentFormatId: _currentFormatId,
				// Filter out invalid formats not included in POST_FORMATS.
				listedFormats: POST_FORMATS.filter( ( { id } ) =>
					currentOrSupportedFormatIds.includes( id )
				),
				suggestedFormat: suggestionIsValid
					? POST_FORMATS.find(
							( { id } ) => id === potentialSuggestedFormatId
					  )
					: null,
			};
		},
		[]
	);

	const { editPost } = useDispatch( editorStore );

	const updatePostFormat = ( formatId ) => editPost( { format: formatId } );

	return (
		<PostFormatCheck>
			<div className="editor-post-format">
				<div className="editor-post-format__content">
					<label htmlFor={ postFormatSelectorId }>
						{ __( 'Post Format' ) }
					</label>
					<SelectControl
						value={ currentFormatId }
						onChange={ updatePostFormat }
						id={ postFormatSelectorId }
						options={ listedFormats.map( ( format ) => ( {
							label: format.caption,
							value: format.id,
						} ) ) }
					/>
				</div>

				{ suggestedFormat && (
					<div className="editor-post-format__suggestion">
						{ __( 'Suggestion:' ) }{ ' ' }
						<Button
							variant="link"
							onClick={ () =>
								updatePostFormat( suggestedFormat.id )
							}
						>
							{ suggestedFormat.caption }
						</Button>
					</div>
				) }
			</div>
		</PostFormatCheck>
	);
}
