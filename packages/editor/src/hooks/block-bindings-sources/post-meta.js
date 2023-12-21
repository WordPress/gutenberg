/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import BlockBindingsFill from '../../components/block-bindings/bindings-ui';
import BlockBindingsFieldsList from '../../components/block-bindings/fields-list';
import { store as editorStore } from '../../store';
import { BLOCK_BINDINGS_ALLOWED_BLOCKS } from '../../store/constants';

if ( window.__experimentalBlockBindings ) {
	// External sources could do something similar.

	const withCoreSources = createHigherOrderComponent(
		( BlockEdit ) => ( props ) => {
			const { name, isSelected, context } = props;
			// If the block is not allowed, return the original BlockEdit.
			if ( ! BLOCK_BINDINGS_ALLOWED_BLOCKS[ name ] ) {
				return <BlockEdit key="edit" { ...props } />;
			}
			const fields = [];
			if ( isSelected ) {
				const data = useSelect(
					( select ) => {
						const postId = context.postId
							? context.postId
							: select( editorStore ).getCurrentPostId();
						const postType = context.postType
							? context.postType
							: select( editorStore ).getCurrentPostType();
						const { getEntityRecord, getEntityRecords } =
							select( coreStore );

						let isTemplate = false;
						// If it is a template, get example data if it is a post/page/cpt.
						if ( postType === 'wp_template' ) {
							isTemplate = true;
							const { slug: templateSlug } = getEntityRecord(
								'postType',
								'wp_template',
								postId
							);

							// Get the post type from the template slug.

							// Match "page-{slug}".
							const pagePattern = /^page(?:-(.+))?$/;
							// Match "single-{postType}-{slug}".
							const postPattern = /^single-([^-]+)(?:-(.+))?$/;
							// Match "wp-custom-template-{slug}".
							const customTemplatePattern =
								/^wp-custom-template-(.+)$/;
							// If it doesn't match any of the accepted patterns, return.
							if (
								! templateSlug !== 'index' &&
								! templateSlug !== 'page' &&
								! pagePattern.test( templateSlug ) &&
								! postPattern.test( templateSlug ) &&
								! customTemplatePattern.test( templateSlug )
							) {
								return null;
							}

							let records = [];
							// If it is an index or a generic page template, return any page.
							if (
								templateSlug === 'index' ||
								templateSlug === 'page'
							) {
								records = getEntityRecords(
									'postType',
									'page',
									{
										per_page: 1,
									}
								);
							}

							// If it is specific page template, return that one.
							if ( pagePattern.test( templateSlug ) ) {
								records = getEntityRecords(
									'postType',
									'page',
									{
										slug: templateSlug.match(
											pagePattern
										)[ 1 ],
									}
								);
							}

							// If it is post/cpt template.
							if ( postPattern.test( templateSlug ) ) {
								const [ , entityPostType, entitySlug ] =
									templateSlug.match( postPattern );

								// If it is a specific post.
								if ( entitySlug ) {
									records = getEntityRecords(
										'postType',
										entityPostType,
										{
											slug: entitySlug,
										}
									);
								} else {
									// If it is a generic template, return any post.
									records = getEntityRecords(
										'postType',
										entityPostType,
										{
											per_page: 1,
										}
									);
								}
							}

							// If it is a custom template, get the fields from any page.
							if (
								customTemplatePattern.test( templateSlug ) ||
								! records
							) {
								records = getEntityRecords(
									'postType',
									'page',
									{
										per_page: 1,
									}
								);
							}

							return { isTemplate, fields: records?.[ 0 ] };
						}

						return {
							isTemplate,
							fields: getEntityRecord(
								'postType',
								postType,
								postId
							),
						};
					},
					[ context.postId, context.postType ]
				);

				if ( ! data || ! data?.fields?.meta ) {
					return <BlockEdit key="edit" { ...props } />;
				}

				// Adapt the data to the format expected by the fields list.
				// Prettifying the name until we receive the label from the REST API endpoint.
				const keyToLabel = ( key ) => {
					return key
						.split( '_' )
						.map(
							( word ) =>
								word.charAt( 0 ).toUpperCase() + word.slice( 1 )
						)
						.join( ' ' );
				};
				Object.entries( data.fields.meta ).forEach(
					( [ key, value ] ) => {
						fields.push( {
							key,
							label: keyToLabel( key ),
							value: data.isTemplate ? null : value,
							placeholder: keyToLabel( key ),
						} );
					}
				);
			}

			return (
				<>
					{ isSelected && fields.length !== 0 && (
						<>
							<BlockBindingsFill
								source="post_meta"
								label="Post Meta"
							>
								<BlockBindingsFieldsList
									fields={ fields }
									source="post_meta"
									{ ...props }
								/>
							</BlockBindingsFill>
						</>
					) }
					<BlockEdit key="edit" { ...props } />
				</>
			);
		},
		'withToolbarControls'
	);

	// TODO: Review if there is a better filter for this.
	// This runs for every block.
	addFilter(
		'editor.BlockEdit',
		'core/block-bindings-ui/add-sources',
		withCoreSources
	);
}
