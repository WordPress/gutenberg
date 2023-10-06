/**
 * WordPress dependencies
 */
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { Popover, Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalLinkControl as LinkControl,
	getLinkValueTransforms,
	BlockIcon,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createInterpolateElement, useMemo } from '@wordpress/element';
import {
	store as coreStore,
	useResourcePermissions,
} from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { switchToBlockType } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { escapeHTML } from '@wordpress/escape-html';
import { safeDecodeURI } from '@wordpress/url';

/**
 * Given the Link block's type attribute, return the query params to give to
 * /wp/v2/search.
 *
 * @param {string} type Link block's type attribute.
 * @param {string} kind Link block's entity of kind (post-type|taxonomy)
 * @return {{ type?: string, subtype?: string }} Search query params.
 */
export function getSuggestionsQuery( type, kind ) {
	switch ( type ) {
		case 'post':
		case 'page':
			return { type: 'post', subtype: type };
		case 'category':
			return { type: 'term', subtype: 'category' };
		case 'tag':
			return { type: 'term', subtype: 'post_tag' };
		case 'post_format':
			return { type: 'post-format' };
		default:
			if ( kind === 'taxonomy' ) {
				return { type: 'term', subtype: type };
			}
			if ( kind === 'post-type' ) {
				return { type: 'post', subtype: type };
			}
			return {
				// for custom link which has no type
				// always show pages as initial suggestions
				initialSuggestionsSearchOptions: {
					type: 'post',
					subtype: 'page',
					perPage: 20,
				},
			};
	}
}

/**
 * Add transforms to Link Control
 *
 * @param {Object} props          Component props.
 * @param {string} props.clientId Block client ID.
 */
function LinkControlTransforms( { clientId } ) {
	const { getBlock, blockTransforms } = useSelect(
		( select ) => {
			const {
				getBlock: _getBlock,
				getBlockRootClientId,
				getBlockTransformItems,
			} = select( blockEditorStore );

			return {
				getBlock: _getBlock,
				blockTransforms: getBlockTransformItems(
					_getBlock( clientId ),
					getBlockRootClientId( clientId )
				),
			};
		},
		[ clientId ]
	);

	const { replaceBlock } = useDispatch( blockEditorStore );

	const featuredBlocks = [
		'core/page-list',
		'core/site-logo',
		'core/social-links',
		'core/search',
	];

	const transforms = blockTransforms.filter( ( item ) => {
		return featuredBlocks.includes( item.name );
	} );

	if ( ! transforms?.length ) {
		return null;
	}

	if ( ! clientId ) {
		return null;
	}

	return (
		<div className="link-control-transform">
			<h3 className="link-control-transform__subheading">
				{ __( 'Transform' ) }
			</h3>
			<div className="link-control-transform__items">
				{ transforms.map( ( item, index ) => {
					return (
						<Button
							key={ `transform-${ index }` }
							onClick={ () =>
								replaceBlock(
									clientId,
									switchToBlockType(
										getBlock( clientId ),
										item.name
									)
								)
							}
							className="link-control-transform__item"
						>
							<BlockIcon icon={ item.icon } />
							{ item.title }
						</Button>
					);
				} ) }
			</div>
		</div>
	);
}

export function LinkUI( props ) {
	const { saveEntityRecord } = useDispatch( coreStore );
	const pagesPermissions = useResourcePermissions( 'pages' );
	const postsPermissions = useResourcePermissions( 'posts' );

	async function handleCreate( pageTitle ) {
		const postType = props.link.type || 'page';

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

	const { label, url, opensInNewTab, type, kind } = props.link;

	let userCanCreate = false;
	if ( ! type || type === 'page' ) {
		userCanCreate = pagesPermissions.canCreate;
	} else if ( type === 'post' ) {
		userCanCreate = postsPermissions.canCreate;
	}

	// Memoize link value to avoid overriding the LinkControl's internal state.
	// This is a temporary fix. See https://github.com/WordPress/gutenberg/issues/50976#issuecomment-1568226407.
	// const link = useMemo(
	// 	() => ( {
	// 		url,
	// 		opensInNewTab,
	// 		title: label && stripHTML( label ),
	// 	} ),
	// 	[ label, opensInNewTab, url ]
	// );

	// ...( newUrl && { url: encodeURI( safeDecodeURI( newUrl ) ) } ),
	// ...( label && { label } ),
	// ...( undefined !== opensInNewTab && { opensInNewTab } ),
	// ...( id && Number.isInteger( id ) && { id } ),
	// ...( kind && { kind } ),
	// ...( type && type !== 'URL' && { type } ),

	const { toLink, toData } = getLinkValueTransforms( {
		url: {
			dataKey: 'url',
			toData: ( value ) => encodeURI( safeDecodeURI( value ) ),
		},
		title: {
			dataKey: 'label',
			toLink: ( value ) => stripHTML( value ),
			toData: (
				newLabel = '',
				{ url: newUrl = '' },
				{ label: originalLabel = '' }
			) => {
				const newLabelWithoutHttp = newLabel.replace(
					/http(s?):\/\//gi,
					''
				);
				const newUrlWithoutHttp = newUrl.replace(
					/http(s?):\/\//gi,
					''
				);

				const useNewLabel =
					newLabel &&
					newLabel !== originalLabel &&
					// LinkControl without the title field relies
					// on the check below. Specifically, it assumes that
					// the URL is the same as a title.
					// This logic a) looks suspicious and b) should really
					// live in the LinkControl and not here. It's a great
					// candidate for future refactoring.
					newLabelWithoutHttp !== newUrlWithoutHttp;

				// Unfortunately this causes the escaping model to be inverted.
				// The escaped content is stored in the block attributes (and ultimately in the database),
				// and then the raw data is "recovered" when outputting into the DOM.
				// It would be preferable to store the **raw** data in the block attributes and escape it in JS.
				// Why? Because there isn't one way to escape data. Depending on the context, you need to do
				// different transforms. It doesn't make sense to me to choose one of them for the purposes of storage.
				// See also:
				// - https://github.com/WordPress/gutenberg/pull/41063
				// - https://github.com/WordPress/gutenberg/pull/18617.
				return useNewLabel
					? escapeHTML( newLabel )
					: originalLabel || escapeHTML( newUrlWithoutHttp );
			},
		},
		opensInNewTab: 'opensInNewTab',
	} );

	const link = toLink( {
		url,
		label,
		opensInNewTab,
	} );

	function handleOnChange( newValue ) {
		// Todo: `title` is undefined when adding a new link. Why????
		return props.onChange( toData( newValue ) );
	}

	return (
		<Popover
			placement="bottom"
			onClose={ props.onClose }
			anchor={ props.anchor }
			shift
		>
			<LinkControl
				hasTextControl
				hasRichPreviews
				value={ link }
				showInitialSuggestions={ true }
				withCreateSuggestion={ userCanCreate }
				createSuggestion={ handleCreate }
				createSuggestionButtonText={ ( searchTerm ) => {
					let format;

					if ( type === 'post' ) {
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
				noDirectEntry={ !! type }
				noURLSuggestion={ !! type }
				suggestionsQuery={ getSuggestionsQuery( type, kind ) }
				onChange={ handleOnChange }
				onRemove={ props.onRemove }
				onCancel={ props.onCancel }
				renderControlBottom={
					! url
						? () => (
								<LinkControlTransforms
									clientId={ props.clientId }
								/>
						  )
						: null
				}
			/>
		</Popover>
	);
}
