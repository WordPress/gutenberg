/**
 * External dependencies
 */
import classnames from 'classnames';
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import {
	AlignmentToolbar,
	BlockControls,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function PostCategoriesEdit( {
	attributes,
	context,
	setAttributes,
} ) {
	const { textAlign } = attributes;
	const { postId, postType } = context;

	const [ categories ] = useEntityProp(
		'postType',
		postType,
		'categories',
		postId
	);

	const categoryLinks = useSelect(
		( select ) => {
			const { getEntityRecord } = select( 'core' );
			let loaded = true;
			const links = map( categories, ( categoryId ) => {
				const category = getEntityRecord(
					'taxonomy',
					'category',
					categoryId
				);
				if ( ! category ) {
					return ( loaded = false );
				}
				return (
					<a key={ categoryId } href={ category.link }>
						{ category.name }
					</a>
				);
			} );
			return loaded && links;
		},
		[ categories ]
	);

	const hasCategories = categoryLinks && categoryLinks.length > 0;

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<Block.div
				className={ classnames( {
					[ `has-text-align-${ textAlign }` ]: textAlign,
				} ) }
			>
				{ hasCategories &&
					categoryLinks.reduce( ( prev, curr ) => [
						prev,
						' | ',
						curr,
					] ) }
				{ ! hasCategories && __( 'No categories.' ) }
			</Block.div>
		</>
	);
}
