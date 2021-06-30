/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	AlignmentToolbar,
	BlockControls,
	Warning,
	useBlockProps,
} from '@wordpress/block-editor';
import { Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import usePostTerms from './use-post-terms';

export default function PostTermsEdit( {
	attributes,
	context,
	setAttributes,
} ) {
	const { term, textAlign } = attributes;
	const { postId, postType } = context;

	const selectedTerm = useSelect(
		( select ) => {
			if ( ! term ) return {};
			const { getTaxonomy } = select( coreStore );
			const taxonomy = getTaxonomy( term );
			return taxonomy?.visibility?.show_ui ? taxonomy : {};
		},
		[ term ]
	);
	const { postTerms, hasPostTerms, isLoading } = usePostTerms( {
		postId,
		postType,
		term: selectedTerm,
	} );
	const hasPost = postId && postType;
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
			[ `taxonomy-${ term }` ]: term,
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
				{ __( 'Post Terms block: no term specified.' ) }
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
				{ isLoading && <Spinner /> }
				{ ! isLoading &&
					hasPostTerms &&
					postTerms
						.map( ( postTerm ) => (
							<a
								key={ postTerm.id }
								href={ postTerm.link }
								onClick={ ( event ) => event.preventDefault() }
							>
								{ postTerm.name }
							</a>
						) )
						.reduce( ( prev, curr ) => [ prev, ' | ', curr ] ) }
				{ ! isLoading &&
					! hasPostTerms &&
					( selectedTerm?.labels?.no_terms ||
						__( 'Term items not found.' ) ) }
			</div>
		</>
	);
}
