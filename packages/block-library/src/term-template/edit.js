/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { memo, useMemo, useState } from '@wordpress/element';
import { layout } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import {
	BlockContextProvider,
	__experimentalUseBlockPreview as useBlockPreview,
	__experimentalBlockVariationPicker as BlockVariationPicker,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
} from '@wordpress/blocks';
import { Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { getQueryContextFromTemplate } from '../utils/get-query-context-from-template';

const TEMPLATE = [
	[
		'core/group',
		{
			layout: {
				type: 'flex',
				orientation: 'horizontal',
			},
			style: {
				spacing: {
					blockGap: '0.5rem',
				},
			},
			metadata: {
				name: __( 'Term Name with Count' ),
			},
		},
		[
			[
				'core/paragraph',
				{
					metadata: {
						name: __( 'Term Name' ),
						bindings: {
							content: {
								source: 'core/term-data',
								args: {
									key: 'name',
								},
							},
						},
					},
				},
			],
			[
				'core/paragraph',
				{
					placeholder: __( '(count)' ),
					metadata: {
						name: __( 'Term Count' ),
						bindings: {
							content: {
								source: 'core/term-data',
								args: {
									key: 'count',
								},
							},
						},
					},
				},
			],
		],
	],
];

function TermTemplateInnerBlocks( { classList } ) {
	const innerBlocksProps = useInnerBlocksProps(
		{ className: clsx( 'wp-block-term', classList ) },
		{ template: TEMPLATE, __unstableDisableLayoutClassNames: true }
	);
	return <li { ...innerBlocksProps } />;
}

function TermTemplateBlockPreview( {
	blocks,
	blockContextId,
	classList,
	isHidden,
	setActiveBlockContextId,
} ) {
	const blockPreviewProps = useBlockPreview( {
		blocks,
		props: {
			className: clsx( 'wp-block-term', classList ),
		},
	} );

	const handleOnClick = () => {
		setActiveBlockContextId( blockContextId );
	};

	const style = {
		display: isHidden ? 'none' : undefined,
	};

	return (
		<li
			{ ...blockPreviewProps }
			tabIndex={ 0 }
			// eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
			role="button"
			onClick={ handleOnClick }
			onKeyPress={ handleOnClick }
			style={ style }
		/>
	);
}

// Prevent re-rendering of the block preview when the terms data changes.
const MemoizedTermTemplateBlockPreview = memo( TermTemplateBlockPreview );

export default function TermTemplateEdit( {
	clientId,
	setAttributes,
	context: {
		termQuery: {
			taxonomy,
			perPage,
			order,
			orderBy,
			include,
			exclude,
			hideEmpty = true,
			inherit,
			context: inheritContext,
			pages,
			parent = 0,
			// Gather extra query args to pass to the REST API call.
			// This way extenders of Term Query Loop can add their own query args,
			// and have accurate previews in the editor.
			// Noting though that these args should either be supported by the
			// REST API or be handled by custom REST filters like `rest_{$this->taxonomy}_query`.
			...restQueryArgs
		} = {},
		termId,
		termData,
		postId,
		templateSlug,
		previewTaxonomy,
	},
	__unstableLayoutClassNames,
} ) {
	const [ activeBlockContextId, setActiveBlockContextId ] = useState();
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );

	const terms = useSelect(
		( select ) => {
			const { getEntityRecords } = select( coreStore );

			const queryArgs = {
				parent: parent || 0,
				order,
				orderby: orderBy,
				hide_empty: hideEmpty,
				// The hierarchical argument is necessary to avoid fetching all terms,
				// which is the default behavior of the REST API when no parent is set.
				hierarchical: false,
				// We fetch the largest number of terms and limit them during rendering, which
				// allows us to avoid re-fetching data when max terms changes.
				per_page: 100,
			};

			// If `inherit` is truthy, adjust the query conditionally to create a better preview.
			let currentTaxonomy = taxonomy;
			if ( inherit ) {
				if ( inheritContext === 'post' && postId ) {
					// If we're on a post, get only the terms for the current post.
					queryArgs.post = postId;
				}
				if ( termId ) {
					// If termId is already provided in context, use that as parent.
					queryArgs.parent = termId;
					// Also inherit the taxonomy from the current term.
					currentTaxonomy = termData?.taxonomy || taxonomy;
				} else if ( inheritContext === 'taxonomy_archive' ) {
					// If we're inheriting but no termId is available in context, check if we're on a taxonomy archive.
					const { templateType, templateQuery } =
						getQueryContextFromTemplate( templateSlug );

					let termSlug = '';
					if (
						( templateType === currentTaxonomy ||
							( templateType === 'tag' &&
								currentTaxonomy === 'post_tag' ) ) &&
						templateQuery
					) {
						termSlug = templateQuery;
					} else if ( templateType === 'taxonomy' && templateQuery ) {
						// Get everything after the first '-' as the term slug.
						termSlug = templateQuery
							.split( '-' )
							.slice( 1 )
							.join( '-' );
					}

					if ( termSlug ) {
						// If we're on a specific term archive template, fetch the term ID to use as the parent.
						const templateTerm = getEntityRecords(
							'taxonomy',
							currentTaxonomy,
							{
								context: 'view',
								per_page: 1,
								_fields: [ 'id' ],
								slug: termSlug,
							}
						);

						if ( templateTerm ) {
							queryArgs.parent = templateTerm[ 0 ]?.id ?? 0;
						}
					}
				}
			}

			// When we preview Term Query Loop blocks we should prefer the current
			// block's taxonomy, which is passed through block context.
			const usedTaxonomy = previewTaxonomy || currentTaxonomy;

			const isHierarchical =
				select( coreStore ).getTaxonomy( usedTaxonomy )?.hierarchical;

			// If parent is defined and the taxonomy is not hierarchical, no need
			// to fetch since there are no child terms.
			if ( queryArgs.parent > 0 && ! isHierarchical ) {
				return [];
			}

			return getEntityRecords( 'taxonomy', usedTaxonomy, {
				...queryArgs,
				...restQueryArgs,
			} );
		},
		[
			parent,
			order,
			orderBy,
			hideEmpty,
			taxonomy,
			inherit,
			previewTaxonomy,
			restQueryArgs,
			inheritContext,
			postId,
			termId,
			termData,
			templateSlug,
		]
	);

	const blockProps = useBlockProps( {
		className: __unstableLayoutClassNames,
	} );

	// Limit terms to the perPage value and filter out excludes.
	const filteredTerms = useMemo( () => {
		if ( null === terms ) {
			return null;
		}
		let termsToFilter = terms;
		// When requesting terms from a specific post, the REST API ignores hierarchical=false
		// and always returns all terms assigned to the post, so we need to filter by parent here.
		if ( inherit && ( postId || parent ) ) {
			termsToFilter = termsToFilter.filter( ( term ) =>
				parent ? term.parent === parent : term.parent === 0
			);
		}
		return termsToFilter.slice( 0, perPage ).filter( ( term ) => {
			if ( exclude && exclude.includes( term.id ) ) {
				return false;
			}
			return true;
		} );
	}, [ terms, inherit, postId, parent, exclude, perPage ] );

	const { blocks, variations, defaultVariation } = useSelect(
		( select ) => {
			const { getBlocks } = select( blockEditorStore );
			const { getBlockVariations, getDefaultBlockVariation } =
				select( blocksStore );

			return {
				blocks: getBlocks( clientId ),
				variations: getBlockVariations( 'core/term-template', 'block' ),
				defaultVariation: getDefaultBlockVariation(
					'core/term-template',
					'block'
				),
			};
		},
		[ clientId ]
	);

	const blockContexts = useMemo(
		() =>
			filteredTerms
				? filteredTerms?.map( ( term ) => ( {
						taxonomy,
						termId: term.id,
						classList: `term-${ term.id }`,
						termData: term,
				  } ) )
				: [],
		[ filteredTerms, taxonomy ]
	);

	// Show variation picker if no blocks exist.
	if ( ! blocks?.length ) {
		return (
			<div { ...blockProps }>
				<BlockVariationPicker
					icon={ layout }
					label={ __( 'Term Template' ) }
					variations={ variations }
					instructions={ __(
						'Choose a layout for displaying terms:'
					) }
					onSelect={ ( nextVariation = defaultVariation ) => {
						if ( nextVariation.attributes ) {
							setAttributes( nextVariation.attributes );
						}
						if ( nextVariation.innerBlocks ) {
							replaceInnerBlocks(
								clientId,
								createBlocksFromInnerBlocksTemplate(
									nextVariation.innerBlocks
								),
								true
							);
						}
					} }
					allowSkip
				/>
			</div>
		);
	}

	if ( ! filteredTerms ) {
		return (
			<div { ...blockProps }>
				<p className="wp-block-term-template__loading">
					<Spinner />
					{ inherit
						? sprintf(
								/* translators: %s: term name */
								__( 'Loading %s child terms…' ),
								termData?.name ?? taxonomy
						  )
						: sprintf(
								/* translators: %s: taxonomy slug */
								__( 'Loading %s terms…' ),
								taxonomy
						  ) }
				</p>
			</div>
		);
	}

	if ( ! filteredTerms.length ) {
		return <p { ...blockProps }> { __( 'No results found.' ) }</p>;
	}

	return (
		<>
			<ul { ...blockProps }>
				{ blockContexts &&
					blockContexts.map( ( blockContext ) => (
						<BlockContextProvider
							key={ blockContext.termId }
							value={ blockContext }
						>
							{ blockContext.termId ===
							( activeBlockContextId ||
								blockContexts[ 0 ]?.termId ) ? (
								<TermTemplateInnerBlocks
									classList={ blockContext.classList }
								/>
							) : null }
							<MemoizedTermTemplateBlockPreview
								blocks={ blocks }
								blockContextId={ blockContext.termId }
								classList={ blockContext.classList }
								setActiveBlockContextId={
									setActiveBlockContextId
								}
								isHidden={
									blockContext.termId ===
									( activeBlockContextId ||
										blockContexts[ 0 ]?.termId )
								}
							/>
						</BlockContextProvider>
					) ) }
			</ul>
		</>
	);
}
