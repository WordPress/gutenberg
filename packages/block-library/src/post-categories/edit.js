/**
 * External dependencies
 */
import classnames from 'classnames';
import { find, map } from 'lodash';

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
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useHierarchicalTerms from './use-hierarchical-terms';
import useHierarchicalTermLinks from './use-hierarchical-term-links';

function HierarchicalTermPicker( {
	hierarchicalTerms,
	isLoadingHierarchicalTerms,
	setAttributes,
} ) {
	if ( isLoadingHierarchicalTerms ) {
		return <Spinner />;
	}

	const variations = map( hierarchicalTerms, ( term ) => ( {
		/* eslint-disable camelcase */
		name: term?.slug,
		title: term?.name,
		description: term?.description,
		is_default: 'category' === term?.slug,
		attributes: {
			term: { restBase: term?.rest_base, slug: term?.slug },
		},
		/* eslint-enable camelcase */
	} ) );

	return (
		<BlockVariationPicker
			variations={ variations }
			onSelect={ ( variation ) => {
				setAttributes( variation.attributes );
			} }
		/>
	);
}

export default function PostCategoriesEdit( {
	attributes,
	context,
	setAttributes,
} ) {
	const { term, textAlign } = attributes;
	const { postId, postType } = context;

	const [ selectedTerm, setSelectedTerm ] = useState();

	const {
		hierarchicalTerms,
		isLoadingHierarchicalTerms,
	} = useHierarchicalTerms();

	const {
		hierarchicalTermLinks,
		isLoadingHierarchicalTermLinks,
	} = useHierarchicalTermLinks( {
		postId,
		postType,
		term,
	} );

	useEffect( () => {
		if ( selectedTerm || ! term?.slug ) {
			return;
		}

		setSelectedTerm( find( hierarchicalTerms, { slug: term.slug } ) );
	} );

	const hasPost = postId && postType;
	const hasHierarchicalTermLinks =
		hierarchicalTermLinks && hierarchicalTermLinks.length > 0;

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
				{ hasPost && ! term && (
					<HierarchicalTermPicker
						hierarchicalTerms={ hierarchicalTerms }
						isLoadingHierarchicalTerms={
							isLoadingHierarchicalTerms
						}
						setAttributes={ setAttributes }
					/>
				) }

				{ hasPost && isLoadingHierarchicalTermLinks && <Spinner /> }

				{ hasPost &&
					hasHierarchicalTermLinks &&
					! isLoadingHierarchicalTermLinks &&
					hierarchicalTermLinks.reduce( ( prev, curr ) => [
						prev,
						' | ',
						curr,
					] ) }

				{ hasPost &&
					!! term &&
					! isLoadingHierarchicalTermLinks &&
					! hasHierarchicalTermLinks &&
					// eslint-disable-next-line camelcase
					( selectedTerm?.labels?.no_terms ||
						__( 'Term items not found.' ) ) }

				{ ! hasPost && (
					<Warning>
						{ __( 'Post Categories block: post not found.' ) }
					</Warning>
				) }
			</Block.div>
		</>
	);
}
