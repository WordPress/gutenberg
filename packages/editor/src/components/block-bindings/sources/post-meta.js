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
import BlockBindingsFill from '../bindings-ui.js';
import BlockBindingsFieldsList from '../fields-list.js';

const PostMeta = ( props ) => {
	const { context } = props;

	// Fetching the REST API to get the available custom fields.
	// TODO: Review if it works with taxonomies.
	// TODO: Explore how it should work in templates.
	// TODO: Explore if it makes sense to create a custom endpoint for this.
	const data = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );
			return getEntityRecord(
				'postType',
				context.postType,
				context.postId
			);
		},
		[ context.postType, context.postId ]
	);

	// Adapt the data to the format expected by the fields list.
	const fields = [];
	// Prettifying the name until we receive the label from the REST API endpoint.
	const keyToLabel = ( key ) => {
		return key
			.split( '_' )
			.map( ( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
			.join( ' ' );
	};
	Object.entries( data.meta ).forEach( ( [ key, value ] ) => {
		fields.push( {
			key,
			label: keyToLabel( key ),
			value,
		} );
	} );

	return (
		<BlockBindingsFieldsList
			fields={ fields }
			source="post_meta"
			{ ...props }
		/>
	);
};

if ( window.__experimentalBlockBindings ) {
	// TODO: Read the context somehow to decide if we should add the source.
	// const data = useSelect( editorStore );

	// External sources could do something similar.
	const withCoreSources = createHigherOrderComponent(
		( BlockEdit ) => ( props ) => {
			const { isSelected } = props;
			return (
				<>
					{ isSelected && (
						<>
							<BlockBindingsFill
								source="post_meta"
								label="Post Meta"
							>
								<PostMeta />
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
