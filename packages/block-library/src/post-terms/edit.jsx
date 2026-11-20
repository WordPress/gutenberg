import clsx from 'clsx';
import {
	BlockControls,
	InspectorControls,
	useBlockProps,
	useBlockDisplayInformation,
	RichText,
	useBlockEditContext,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import {
	Spinner as WCSpinner,
	TextControl,
	ToolbarButton,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useRef, useState } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';
import { __, isRTL } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import usePostTerms from './use-post-terms';
import { getAlignmentUpdates, withTextAlign } from './text-align';

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
	const { term, separator, prefix, suffix, layout, style } = attributes;
	const hasItems = [ 'flex', 'grid' ].includes( layout?.type );
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const lastLayoutRef = useRef( {
		type: layout?.type,
		justifyContent: layout?.justifyContent,
		orientation: layout?.orientation,
	} );
	/**
	 * Keeps the text alignment and the Flex Justification in step when the
	 * layout type changes. It runs whenever the layout changes, so the ref holds
	 * the Flex values from just before a switch.
	 */
	const alignmentSyncRef = useRefEffect( () => {
		const previousLayout = lastLayoutRef.current;
		const currentLayout = {
			type: layout?.type,
			justifyContent: layout?.justifyContent,
			orientation: layout?.orientation,
		};
		lastLayoutRef.current = currentLayout;
		const updates = getAlignmentUpdates(
			previousLayout,
			currentLayout,
			style?.typography?.textAlign,
			isRTL()
		);
		if ( ! updates ) {
			return;
		}
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes(
			'justifyContent' in updates
				? { layout: { ...layout, ...updates } }
				: { style: withTextAlign( style, updates.textAlign ) }
		);
	}, [
		layout,
		style,
		setAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );
	const { __unstableLayoutClassNames: layoutClassNames } =
		useBlockEditContext();
	const [ isAddingPrefix, setIsAddingPrefix ] = useState( false );
	const [ isAddingSuffix, setIsAddingSuffix ] = useState( false );
	const prefixRef = useRefEffect(
		( node ) => {
			if ( isAddingPrefix ) {
				node.focus();
			}
		},
		[ isAddingPrefix ]
	);
	const suffixRef = useRefEffect(
		( node ) => {
			if ( isAddingSuffix ) {
				node.focus();
			}
		},
		[ isAddingSuffix ]
	);
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
	/**
	 * A template has no post, so a few sample terms stand in for the real ones.
	 * That way the layout, spacing and separator can be checked there.
	 */
	const sampleTerms =
		! hasPost && term
			? [ __( 'Term 1' ), __( 'Term 2' ), __( 'Term 3' ) ].map(
					( name, index ) => ( { id: index, name, link: '#' } )
				)
			: [];
	const hasSampleTerms = sampleTerms.length > 0;
	const termsToList = hasSampleTerms ? sampleTerms : postTerms;
	const showTerms =
		hasSampleTerms || ( hasPost && ! isLoading && hasPostTerms );
	const blockInformation = useBlockDisplayInformation( clientId );
	const blockProps = useBlockProps( {
		ref: alignmentSyncRef,
		className: clsx(
			term && `taxonomy-${ term }`,
			layout && layoutClassNames
		),
	} );

	return (
		<>
			{ hasItems && ( ! prefix || ! suffix ) && (
				<BlockControls>
					{ ! prefix && ! isAddingPrefix && (
						<ToolbarButton
							key="prefix"
							onMouseDown={ ( event ) => event.preventDefault() }
							onClick={ () => setIsAddingPrefix( true ) }
						>
							{ __( 'Add prefix' ) }
						</ToolbarButton>
					) }
					{ ! suffix && ! isAddingSuffix && (
						<ToolbarButton
							key="suffix"
							onMouseDown={ ( event ) => event.preventDefault() }
							onClick={ () => setIsAddingSuffix( true ) }
						>
							{ __( 'Add suffix' ) }
						</ToolbarButton>
					) }
				</BlockControls>
			) }
			{ ! hasItems && (
				<InspectorControls group="advanced">
					<TextControl
						autoComplete="off"
						label={ __( 'Separator' ) }
						value={ separator || '' }
						onChange={ ( nextValue ) => {
							setAttributes( { separator: nextValue } );
						} }
						help={ __(
							'Enter character(s) used to separate terms.'
						) }
					/>
				</InspectorControls>
			) }
			<div { ...blockProps }>
				{ isLoading && hasPost && <WCSpinner /> }
				{ ! isLoading && showPrefix && (
					<RichText
						ref={ prefixRef }
						onBlur={ () => ! prefix && setIsAddingPrefix( false ) }
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
				{ ! term && <span>{ blockInformation.title }</span> }
				{ showTerms &&
					termsToList
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
						onBlur={ () => ! suffix && setIsAddingSuffix( false ) }
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
