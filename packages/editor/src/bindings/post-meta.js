/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { select } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';

const { getCurrentPostType } = select( editorStore );

// Prettify the name until the label is available in the REST API endpoint.
const keyToLabel = ( key ) => {
	return key
		.split( '_' )
		.map( ( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
		.join( ' ' );
};

export default {
	name: 'post_meta',
	label: 'Post Meta',
	component: null,
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
		return {
			placeholder: keyToLabel( metaKey ),
			useValue: [ metaValue, updateMetaValue ],
		};
	},
};
