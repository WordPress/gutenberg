/**
 * WordPress dependencies
 */
import { updateBlockBindingsAttribute } from '@wordpress/block-editor';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import { store as editorStore } from '../store';

function PostMetaComponent( props, selectedAttribute ) {
	const {
		DropdownMenuGroupV2: DropdownMenuGroup,
		DropdownMenuItemLabelV2: DropdownMenuItemLabel,
		DropdownMenuCheckboxItemV2: DropdownMenuCheckboxItem,
	} = unlock( componentsPrivateApis );
	const { context, metadata, setAttributes } = props;
	// TODO: Expose the post meta in the `types` REST API endpoint and use that.
	const data = useSelect(
		( select ) => {
			const postId = context.postId
				? context.postId
				: select( editorStore ).getCurrentPostId();
			const postType = context.postType
				? context.postType
				: select( editorStore ).getCurrentPostType();
			const { getEntityRecord } = select( coreStore );
			return getEntityRecord( 'postType', postType, postId );
		},
		[ context.postId, context.postType ]
	);
	if ( ! data || ! data.meta ) {
		return null;
	}

	// Prettify the name until the label is available in the REST API endpoint.
	const keyToLabel = ( key ) => {
		return key
			.split( '_' )
			.map( ( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
			.join( ' ' );
	};

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
		const [ meta, setMeta ] = useEntityProp(
			'postType',
			context.postType,
			'meta',
			context.postId
		);
		const metaValue = meta[ metaKey ];
		const updateMetaValue = ( newValue ) => {
			setMeta( { ...meta, [ metaKey ]: newValue } );
		};
		return [ metaValue, updateMetaValue ];
	},
};
