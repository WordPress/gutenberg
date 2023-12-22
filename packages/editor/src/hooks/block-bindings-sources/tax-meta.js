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
						const postType = context.postType
							? context.postType
							: select( editorStore ).getCurrentPostType();

						if ( postType !== 'wp_template' ) {
							return null;
						}

						const { getEntityRecord, getEntityRecords } =
							select( coreStore );
						const templateId = context.postId
							? context.postId
							: select( editorStore ).getCurrentPostId();
						const { slug: templateSlug } = getEntityRecord(
							'postType',
							'wp_template',
							templateId
						);

						// Match "term-{slug}".
						const patterns = [
							{
								term: 'archive',
								pattern: /^archive(?:-(.+))?$/,
							},
							{ term: 'author', pattern: /^author(?:-(.+))?$/ },
							{
								term: 'category',
								pattern: /^category(?:-(.+))?$/,
							},
							{ term: 'tag', pattern: /^tag(?:-(.+))?$/ },
							{
								term: 'taxonomy',
								pattern: /^taxonomy(?:-(.+))?$/,
							},
						];

						for ( let i = 0; i < patterns.length; i++ ) {
							const { term, pattern } = patterns[ i ];
							const match = templateSlug.match( pattern );
							if ( match ) {
								const [ , entitySlug ] = match;
								if ( term === 'archive' ) {
									// General template for all archives.
									if ( ! entitySlug )
										return getEntityRecords(
											'taxonomy',
											'category',
											{
												per_page: 1,
											}
										)?.[ 0 ];
									// Specific archive template.
									return getEntityRecords(
										'taxonomy',
										entitySlug,
										{
											per_page: 1,
										}
									)?.[ 0 ];
								}
								// For the rest of templates.
								if ( ! entitySlug ) {
									return getEntityRecords( 'taxonomy', term, {
										per_page: 1,
									} )?.[ 0 ];
								}
								return getEntityRecords( 'taxonomy', term, {
									slug: entitySlug,
								} )?.[ 0 ];
							}
						}

						return null;
					},
					[ context.postId, context.postType ]
				);

				if ( ! data || ! data?.meta ) {
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
				Object.entries( data.meta ).forEach( ( [ key, value ] ) => {
					fields.push( {
						key,
						label: keyToLabel( key ),
						value: data.isTemplate ? null : value,
						placeholder: data.isTemplate ? keyToLabel( key ) : null,
					} );
				} );
			}

			return (
				<>
					{ isSelected && fields.length !== 0 && (
						<>
							<BlockBindingsFill
								source="tax_meta"
								label="Taxonomy Meta"
							>
								<BlockBindingsFieldsList
									fields={ fields }
									source="tax_meta"
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

	addFilter(
		'editor.BlockEdit',
		'core/block-bindings-ui/add-sources',
		withCoreSources
	);
}
