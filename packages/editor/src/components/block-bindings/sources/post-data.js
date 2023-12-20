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

const PostData = ( props ) => {
	const { context } = props;

	// Fetching the REST API to get the post data.
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
	// TODO: Ensure the key and label work with translations.
	const fields = [
		{
			key: 'post_title',
			label: 'Post title',
			value: data.title.rendered,
		},
		{
			key: 'post_date',
			label: 'Post date',
			value: data.date,
		},
		{
			key: 'guid',
			label: 'Post link',
			value: data.link,
		},
	];

	return (
		<BlockBindingsFieldsList
			fields={ fields }
			source="post_data"
			{ ...props }
		/>
	);
};

if ( window.__experimentalBlockBindings ) {
	// TODO: Read the context somehow to decide if we should add the source.

	const withCoreSources = createHigherOrderComponent(
		( BlockEdit ) => ( props ) => {
			const { isSelected } = props;

			return (
				<>
					{ isSelected && (
						<>
							<BlockBindingsFill
								source="post_data"
								label="Post data"
							>
								<PostData />
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
