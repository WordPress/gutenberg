/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { memo, useMemo, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { layout } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import {
	BlockContextProvider,
	__experimentalUseBlockPreview as useBlockPreview,
	__experimentalBlockVariationPicker as BlockVariationPicker,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useEntityRecords } from '@wordpress/core-data';
import {
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
} from '@wordpress/blocks';

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
			order,
			orderBy,
			hideEmpty,
			hierarchical = false,
			parent = 0,
			perPage = 10,
		} = {},
	},
	__unstableLayoutClassNames,
} ) {
	const [ activeBlockContextId, setActiveBlockContextId ] = useState();
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );

	const queryArgs = {
		hide_empty: hideEmpty,
		order,
		orderby: orderBy,
		// To preview the data the closest to the frontend, we fetch the largest number of terms
		// and limit them during rendering. This is because WP_Term_Query fetches data in hierarchical manner,
		// while in editor we build the hierarchy manually. It also allows us to avoid re-fetching data when max terms changes.
		per_page: 100,
	};

	// Nested terms are returned by default from REST API as long as parent is not set.
	// If we want to show nested terms, we must not set parent at all.
	if ( parent || ! hierarchical ) {
		queryArgs.parent = parent || 0;
	}

	const { records: terms, isResolving } = useEntityRecords(
		'taxonomy',
		taxonomy,
		queryArgs
	);

	const filteredTerms = useMemo( () => {
		if ( ! terms ) {
			return [];
		}
		// Limit to the number of terms defined by perPage.
		return perPage === 0 ? terms : terms.slice( 0, perPage );
	}, [ terms, perPage ] );

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

	const blockProps = useBlockProps( {
		className: __unstableLayoutClassNames,
	} );

	const blockContexts = useMemo(
		() =>
			filteredTerms?.map( ( term ) => ( {
				taxonomy,
				termId: term.id,
				classList: `term-${ term.id }`,
				termData: term,
			} ) ),
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

	if ( isResolving ) {
		return (
			<ul { ...blockProps }>
				<li className="wp-block-term term-loading">
					<div className="term-loading-placeholder" />
				</li>
				<li className="wp-block-term term-loading">
					<div className="term-loading-placeholder" />
				</li>
				<li className="wp-block-term term-loading">
					<div className="term-loading-placeholder" />
				</li>
			</ul>
		);
	}

	if ( ! filteredTerms?.length ) {
		return <p { ...blockProps }> { __( 'No terms found.' ) }</p>;
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
