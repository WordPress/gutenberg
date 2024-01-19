/**
 * WordPress dependencies
 */
import { updateBlockBindingsAttribute } from '@wordpress/block-editor';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { select } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import { store as editorStore } from '../store';

const { getCurrentPostId, getCurrentPostType } = select( editorStore );
const { getEntityRecord, getEntityRecords } = select( coreStore );

// Prettify the name until the label is available in the REST API endpoint.
const keyToLabel = ( key ) => {
	return key
		.split( '_' )
		.map( ( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
		.join( ' ' );
};

function PostMetaComponent( props, blockContext, selectedAttribute ) {
	const {
		DropdownMenuGroupV2: DropdownMenuGroup,
		DropdownMenuItemLabelV2: DropdownMenuItemLabel,
		DropdownMenuCheckboxItemV2: DropdownMenuCheckboxItem,
	} = unlock( componentsPrivateApis );
	const { metadata, setAttributes } = props;

	// Get list of post_meta fields depending on the context.
	const postId = blockContext.postId
		? blockContext.postId
		: getCurrentPostId();
	const postType = blockContext.postType
		? blockContext.postType
		: getCurrentPostType();

	let data = {};
	if ( postType === 'wp_template' ) {
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
		const customTemplatePattern = /^wp-custom-template-(.+)$/;
		// If it doesn't match any of the accepted patterns, return.
		if (
			! templateSlug !== 'index' &&
			! templateSlug !== 'page' &&
			! pagePattern.test( templateSlug ) &&
			! postPattern.test( templateSlug ) &&
			! customTemplatePattern.test( templateSlug )
		) {
			data = null;
		}

		let records = [];
		// If it is an index or a generic page template, return any page.
		if ( templateSlug === 'index' || templateSlug === 'page' ) {
			records = getEntityRecords( 'postType', 'page', {
				per_page: 1,
			} );
		}

		// If it is specific page template, return that one.
		if ( pagePattern.test( templateSlug ) ) {
			records = getEntityRecords( 'postType', 'page', {
				slug: templateSlug.match( pagePattern )[ 1 ],
			} );
		}

		// If it is post/cpt template.
		if ( postPattern.test( templateSlug ) ) {
			const [ , entityPostType, entitySlug ] =
				templateSlug.match( postPattern );

			// If it is a specific post.
			if ( entitySlug ) {
				records = getEntityRecords( 'postType', entityPostType, {
					slug: entitySlug,
				} );
			} else {
				// If it is a generic template, return any post.
				records = getEntityRecords( 'postType', entityPostType, {
					per_page: 1,
				} );
			}
		}

		// If it is a custom template, get the fields from any page.
		if ( customTemplatePattern.test( templateSlug ) || ! records ) {
			records = getEntityRecords( 'postType', 'page', {
				per_page: 1,
			} );
		}

		data = records?.[ 0 ];
	} else {
		data = getEntityRecord( 'postType', postType, postId );
	}

	if ( ! data || ! data?.meta ) {
		return null;
	}

	return (
		<DropdownMenuGroup>
			{ Object.keys( data.meta ).map( ( key ) => {
				return (
					<DropdownMenuCheckboxItem
						key={ key }
						name={ 'bindings-attribute' }
						value={ key }
						checked={
							metadata?.bindings?.[ selectedAttribute ]?.source
								?.name === 'post_meta' &&
							metadata?.bindings?.[ selectedAttribute ]?.source
								?.attributes?.value === key
						}
						onClick={ async () => {
							updateBlockBindingsAttribute(
								{ metadata },
								setAttributes,
								selectedAttribute,
								'post_meta',
								{ value: key }
							);
						} }
					>
						<DropdownMenuItemLabel>
							{ keyToLabel( key ) }
						</DropdownMenuItemLabel>
					</DropdownMenuCheckboxItem>
				);
			} ) }
		</DropdownMenuGroup>
	);
}

export default {
	name: 'post_meta',
	label: 'Post Meta',
	component: PostMetaComponent,
	useSource( props, sourceAttributes ) {
		const { context } = props;
		const { value: metaKey } = sourceAttributes;
		const postType = context.postType
			? context.postType
			: getCurrentPostType();
		const [ meta, setMeta ] = useEntityProp(
			'postType',
			context.postType,
			'meta',
			context.postId
		);

		if ( postType === 'wp_template' ) {
			return { placeholder: keyToLabel( metaKey ) };
		}
		const metaValue = meta[ metaKey ];
		const updateMetaValue = ( newValue ) => {
			setMeta( { ...meta, [ metaKey ]: newValue } );
		};
		return { useValue: [ metaValue, updateMetaValue ] };
	},
};
