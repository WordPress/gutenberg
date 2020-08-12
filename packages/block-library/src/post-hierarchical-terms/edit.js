/**
 * External dependencies
 */
import classnames from 'classnames';
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	AlignmentToolbar,
	BlockControls,
	Warning,
	__experimentalBlock as Block,
	__experimentalBlockVariationPicker as BlockVariationPicker,
} from '@wordpress/block-editor';
import { Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useHierarchicalTermLinks from './use-hierarchical-term-links';

export default function PostHierarchicalTermsEdit( {
	attributes,
	clientId,
	context,
	name,
	setAttributes,
} ) {
	const { term, textAlign } = attributes;
	const { postId, postType } = context;

	const { blockType, defaultVariation, variations } = useSelect(
		( select ) => {
			const {
				getBlockVariations,
				getBlockType,
				getDefaultBlockVariation,
			} = select( 'core/blocks' );

			return {
				blockType: getBlockType( name ),
				defaultVariation: getDefaultBlockVariation( name, 'block' ),
				variations: getBlockVariations( name, 'block' ),
			};
		},
		[ clientId, name ]
	);

	const selectedTerm = useSelect(
		( select ) => {
			if ( ! term ) return {};
			const taxonomies = select( 'core' ).getTaxonomies( {
				per_page: -1,
			} );
			return (
				find(
					taxonomies,
					( taxonomy ) =>
						taxonomy.slug === term &&
						taxonomy.hierarchical &&
						taxonomy.visibility.show_ui
				) || {}
			);
		},
		[ term ]
	);

	const {
		hierarchicalTermLinks,
		isLoadingHierarchicalTermLinks,
	} = useHierarchicalTermLinks( {
		postId,
		postType,
		term: selectedTerm,
	} );

	const hasPost = postId && postType;
	const hasHierarchicalTermLinks =
		hierarchicalTermLinks && hierarchicalTermLinks.length > 0;

	if ( ! hasPost ) {
		return (
			<Block.div>
				<Warning>
					{ __( 'Post Hierarchical Terms block: post not found.' ) }
				</Warning>
			</Block.div>
		);
	}

	if ( ! term ) {
		return (
			<Block.div>
				<BlockVariationPicker
					icon={ blockType?.icon?.src }
					label={ blockType?.title }
					onSelect={ ( variation = defaultVariation ) => {
						setAttributes( variation.attributes );
					} }
					variations={ variations }
				/>
			</Block.div>
		);
	}

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
				{ isLoadingHierarchicalTermLinks && <Spinner /> }

				{ hasHierarchicalTermLinks &&
					! isLoadingHierarchicalTermLinks &&
					hierarchicalTermLinks.reduce( ( prev, curr ) => [
						prev,
						' | ',
						curr,
					] ) }

				{ ! isLoadingHierarchicalTermLinks &&
					! hasHierarchicalTermLinks &&
					// eslint-disable-next-line camelcase
					( selectedTerm?.labels?.no_terms ||
						__( 'Term items not found.' ) ) }
			</Block.div>
		</>
	);
}
