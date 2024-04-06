/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	AlignmentToolbar,
	InspectorControls,
	BlockControls,
	useBlockProps,
	useBlockDisplayInformation,
	RichText,
} from '@wordpress/block-editor';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { TextControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

// Allowed formats for the prefix and suffix fields.
const ALLOWED_FORMATS = [
	'core/bold',
	'core/image',
	'core/italic',
	'core/link',
	'core/strikethrough',
	'core/text-color',
];

export default function PostTermsEdit( {
	attributes,
	clientId,
	context,
	isSelected,
	setAttributes,
	insertBlocksAfter,
} ) {
	const { term, textAlign, separator, prefix, suffix } = attributes;
	const { postId, postType } = context;

	const post = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecord( 'postType', postType, postId ),
		[ postType, postId ]
	);
	const postTerms = post?._embedded?.[ 'wp:term' ]?.[ 0 ]?.filter(
		( { taxonomy } ) => taxonomy === term
	);
	const hasPostTerms = !! postTerms?.length;
	const noTermsLabel = useSelect(
		( select ) => {
			if ( hasPostTerms ) return;
			return select( coreStore ).getTaxonomy( term )?.labels?.no_terms;
		},
		[ hasPostTerms, term ]
	);
	const hasPost = postId && postType;
	const blockInformation = useBlockDisplayInformation( clientId );
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
			[ `taxonomy-${ term }` ]: term,
		} ),
	} );

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
			<InspectorControls group="advanced">
				<TextControl
					__nextHasNoMarginBottom
					autoComplete="off"
					label={ __( 'Separator' ) }
					value={ separator || '' }
					onChange={ ( nextValue ) => {
						setAttributes( { separator: nextValue } );
					} }
					help={ __( 'Enter character(s) used to separate terms.' ) }
				/>
			</InspectorControls>
			<div { ...blockProps }>
				{ ( isSelected || prefix ) && (
					<RichText
						identifier="prefix"
						allowedFormats={ ALLOWED_FORMATS }
						className="wp-block-post-terms__prefix"
						aria-label={ __( 'Prefix' ) }
						placeholder={ __( 'Prefix' ) + ' ' }
						value={ prefix }
						onChange={ ( value ) =>
							setAttributes( { prefix: value } )
						}
						tagName="span"
					/>
				) }
				{ ( ! hasPost || ! term ) && (
					<span>{ blockInformation.title }</span>
				) }
				{ hasPost &&
					hasPostTerms &&
					postTerms
						.map( ( postTerm ) => (
							<a
								key={ postTerm.id }
								href={ postTerm.link }
								onClick={ ( event ) => event.preventDefault() }
							>
								{ decodeEntities( postTerm.name ) }
							</a>
						) )
						.reduce( ( prev, curr ) => (
							<>
								{ prev }
								<span className="wp-block-post-terms__separator">
									{ separator || ' ' }
								</span>
								{ curr }
							</>
						) ) }
				{ hasPost &&
					! hasPostTerms &&
					( noTermsLabel || __( 'Term items not found.' ) ) }
				{ ( isSelected || suffix ) && (
					<RichText
						identifier="suffix"
						allowedFormats={ ALLOWED_FORMATS }
						className="wp-block-post-terms__suffix"
						aria-label={ __( 'Suffix' ) }
						placeholder={ ' ' + __( 'Suffix' ) }
						value={ suffix }
						onChange={ ( value ) =>
							setAttributes( { suffix: value } )
						}
						tagName="span"
						__unstableOnSplitAtEnd={ () =>
							insertBlocksAfter(
								createBlock( getDefaultBlockName() )
							)
						}
					/>
				) }
			</div>
		</>
	);
}
