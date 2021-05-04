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
	useBlockProps,
	__experimentalBlockVariationPicker as BlockVariationPicker,
} from '@wordpress/block-editor';
import { store as blocksStore } from '@wordpress/blocks';
import { Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import useTermLinks from './use-term-links';

export default function PostTermsEdit( {
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
			} = select( blocksStore );

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
			const taxonomies = select( coreStore ).getTaxonomies( {
				per_page: -1,
			} );
			return (
				find(
					taxonomies,
					( taxonomy ) =>
						taxonomy.slug === term && taxonomy.visibility.show_ui
				) || {}
			);
		},
		[ term ]
	);

	const { termLinks, isLoadingTermLinks } = useTermLinks( {
		postId,
		postType,
		term: selectedTerm,
	} );

	const hasPost = postId && postType;
	const hasTermLinks = termLinks && termLinks.length > 0;
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	if ( ! hasPost ) {
		return (
			<div { ...blockProps }>
				<Warning>{ __( 'Post Terms block: post not found.' ) }</Warning>
			</div>
		);
	}

	if ( ! term ) {
		return (
			<div { ...blockProps }>
				<BlockVariationPicker
					icon={ blockType?.icon?.src }
					label={ blockType?.title }
					onSelect={ ( variation = defaultVariation ) => {
						setAttributes( variation.attributes );
					} }
					variations={ variations }
				/>
			</div>
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
			<div { ...blockProps }>
				{ isLoadingTermLinks && <Spinner /> }

				{ hasTermLinks &&
					! isLoadingTermLinks &&
					termLinks.reduce( ( prev, curr ) => [
						prev,
						' | ',
						curr,
					] ) }

				{ ! isLoadingTermLinks &&
					! hasTermLinks &&
					// eslint-disable-next-line camelcase
					( selectedTerm?.labels?.no_terms ||
						__( 'Term items not found.' ) ) }
			</div>
		</>
	);
}
