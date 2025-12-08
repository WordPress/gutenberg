/**
 * External dependencies
 */
import clsx from 'clsx';

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
	__experimentalGetGapCSSValue as getGapCSSValue,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { Spinner, TextControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import usePostTerms from './use-post-terms';

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
	const blockEditingMode = useBlockEditingMode();
	const showControls = blockEditingMode === 'default';

	const selectedTerm = useSelect(
		( select ) => {
			if ( ! term ) {
				return {};
			}
			const { getTaxonomy } = select( coreStore );
			const taxonomy = getTaxonomy( term );
			return taxonomy?.visibility?.publicly_queryable ? taxonomy : {};
		},
		[ term ]
	);
	const { postTerms, hasPostTerms, isLoading } = usePostTerms( {
		postId,
		term: selectedTerm,
	} );
	const hasPost = postId && postType;
	const blockInformation = useBlockDisplayInformation( clientId );
	const blockGap = attributes?.style?.spacing?.blockGap;
	const fallbackValue = 'var(--wp--style--block-gap)';
	const gap = blockGap ? getGapCSSValue( blockGap ) : fallbackValue;

	const blockProps = useBlockProps( {
		layout: true,
		className: clsx( {
			'is-layout-flex': true,
			[ `has-text-align-${ textAlign }` ]: textAlign,
			[ `taxonomy-${ term }` ]: term,
		} ),
		style: {
			gap,
		},
	} );

	return (
		<>
			{ showControls && (
				<BlockControls>
					<AlignmentToolbar
						value={ textAlign }
						onChange={ ( nextAlign ) => {
							setAttributes( { textAlign: nextAlign } );
						} }
					/>
				</BlockControls>
			) }
			<InspectorControls group="advanced">
				<TextControl
					__next40pxDefaultSize
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
				{ isLoading && hasPost && <Spinner /> }
				{ ! isLoading && ( isSelected || prefix ) && (
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
					! isLoading &&
					hasPostTerms &&
					postTerms.map( ( postTerm, index ) => (
						<span key={ postTerm.id }>
							<a
								href={ postTerm.link }
								onClick={ ( event ) => event.preventDefault() }
								rel="tag"
							>
								{ decodeEntities( postTerm.name ) }
							</a>
							{ index < postTerms.length - 1 && (
								<span className="wp-block-post-terms__separator">
									{ separator || ' ' }
								</span>
							) }
						</span>
					) ) }
				{ hasPost &&
					! isLoading &&
					! hasPostTerms &&
					( selectedTerm?.labels?.no_terms ||
						__( 'Term items not found.' ) ) }
				{ ! isLoading && ( isSelected || suffix ) && (
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
