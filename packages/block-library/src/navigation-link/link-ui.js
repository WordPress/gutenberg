/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { __experimentalLinkControl as LinkControl } from '@wordpress/block-editor';
import { createInterpolateElement } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { getSuggestionsQuery, LinkControlTransforms } from './edit';
import { updateAttributes } from './update-attributes';

export function LinkUI( props ) {
	const { saveEntityRecord } = useDispatch( coreStore );

	async function handleCreate( pageTitle ) {
		const postType = props.type || 'page';

		const page = await saveEntityRecord( 'postType', postType, {
			title: pageTitle,
			status: 'draft',
		} );

		return {
			id: page.id,
			type: postType,
			// Make `title` property consistent with that in `fetchLinkSuggestions` where the `rendered` title (containing HTML entities)
			// is also being decoded. By being consistent in both locations we avoid having to branch in the rendering output code.
			// Ideally in the future we will update both APIs to utilise the "raw" form of the title which is better suited to edit contexts.
			// e.g.
			// - title.raw = "Yes & No"
			// - title.rendered = "Yes &#038; No"
			// - decodeEntities( title.rendered ) = "Yes & No"
			// See:
			// - https://github.com/WordPress/gutenberg/pull/41063
			// - https://github.com/WordPress/gutenberg/blob/a1e1fdc0e6278457e9f4fc0b31ac6d2095f5450b/packages/core-data/src/fetch/__experimental-fetch-link-suggestions.js#L212-L218
			title: decodeEntities( page.title.rendered ),
			url: page.link,
			kind: 'post-type',
		};
	}

	return (
		<Popover
			placement="bottom"
			onClose={ () => props.setIsLinkOpen( false ) }
			anchor={ props.popoverAnchor }
			shift
		>
			<LinkControl
				hasTextControl
				hasRichPreviews
				className="wp-block-navigation-link__inline-link-input"
				value={ props.link }
				showInitialSuggestions={ true }
				withCreateSuggestion={ props.userCanCreate }
				createSuggestion={ handleCreate }
				createSuggestionButtonText={ ( searchTerm ) => {
					let format;

					if ( props.type === 'post' ) {
						/* translators: %s: search term. */
						format = __( 'Create draft post: <mark>%s</mark>' );
					} else {
						/* translators: %s: search term. */
						format = __( 'Create draft page: <mark>%s</mark>' );
					}

					return createInterpolateElement(
						sprintf( format, searchTerm ),
						{
							mark: <mark />,
						}
					);
				} }
				noDirectEntry={ !! props.type }
				noURLSuggestion={ !! props.type }
				suggestionsQuery={ getSuggestionsQuery(
					props.type,
					props.kind
				) }
				onChange={ ( updatedValue ) =>
					updateAttributes(
						updatedValue,
						props.setAttributes,
						props.attributes
					)
				}
				onRemove={ props.onRemove }
				renderControlBottom={
					! props.url
						? () => (
								<LinkControlTransforms
									clientId={ props.clientId }
									replace={ props.replaceBlock }
								/>
						  )
						: null
				}
			/>
		</Popover>
	);
}
