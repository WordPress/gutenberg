import clsx from 'clsx';
import {
	BlockControls,
	InspectorControls,
	useBlockProps,
	useBlockDisplayInformation,
	RichText,
	useBlockEditContext,
} from '@wordpress/block-editor';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import {
	Spinner as WCSpinner,
	TextControl,
	ToolbarButton,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
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
	const { term, separator, prefix, suffix, layout } = attributes;
	const hasItems = [ 'flex', 'grid' ].includes( layout?.type );
	const { __unstableLayoutClassNames: layoutClassNames } =
		useBlockEditContext();
	const [ isAddingPrefix, setIsAddingPrefix ] = useState( false );
	const [ isAddingSuffix, setIsAddingSuffix ] = useState( false );
	const prefixRef = useRef();
	const suffixRef = useRef();
	/**
	 * In a flex or grid layout an empty editor would become a layout item, so
	 * it only shows once it has text or the user added it from the toolbar.
	 */
	const showPrefix = hasItems
		? prefix || isAddingPrefix
		: isSelected || prefix;
	const showSuffix = hasItems
		? suffix || isAddingSuffix
		: isSelected || suffix;
	const { postId, postType } = context;

	useEffect( () => {
		if ( isAddingPrefix ) {
			prefixRef.current?.focus();
		}
	}, [ isAddingPrefix ] );

	useEffect( () => {
		if ( isAddingSuffix ) {
			suffixRef.current?.focus();
		}
	}, [ isAddingSuffix ] );

	useEffect( () => {
		if ( ! isSelected ) {
			setIsAddingPrefix( false );
			setIsAddingSuffix( false );
		}
	}, [ isSelected ] );

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
	const blockProps = useBlockProps( {
		className: clsx( term && `taxonomy-${ term }`, layoutClassNames ),
	} );

	return (
		<>
			{ hasItems && ( ! prefix || ! suffix ) && (
				<BlockControls>
					{ ! prefix && ! isAddingPrefix && (
						<ToolbarButton
							onClick={ () => setIsAddingPrefix( true ) }
						>
							{ __( 'Add prefix' ) }
						</ToolbarButton>
					) }
					{ ! suffix && ! isAddingSuffix && (
						<ToolbarButton
							onClick={ () => setIsAddingSuffix( true ) }
						>
							{ __( 'Add suffix' ) }
						</ToolbarButton>
					) }
				</BlockControls>
			) }
			<InspectorControls group="advanced">
				<TextControl
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
				{ isLoading && hasPost && <WCSpinner /> }
				{ ! isLoading && showPrefix && (
					<RichText
						ref={ prefixRef }
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
					postTerms
						.map( ( postTerm ) => (
							<a
								key={ postTerm.id }
								href={ postTerm.link }
								onClick={ ( event ) => event.preventDefault() }
								rel="tag"
							>
								{ decodeEntities( postTerm.name ) }
							</a>
						) )
						.reduce( ( prev, curr ) => (
							<>
								{ prev }
								{ ! hasItems && (
									<span className="wp-block-post-terms__separator">
										{ separator || ' ' }
									</span>
								) }
								{ curr }
							</>
						) ) }
				{ hasPost &&
					! isLoading &&
					! hasPostTerms &&
					( selectedTerm?.labels?.no_terms ||
						__( 'Term items not found.' ) ) }
				{ ! isLoading && showSuffix && (
					<RichText
						ref={ suffixRef }
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
						__unstableOnSplitAtEnd={
							insertBlocksAfter
								? () =>
										insertBlocksAfter(
											createBlock( getDefaultBlockName() )
										)
								: undefined
						}
					/>
				) }
			</div>
		</>
	);
}
