/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { memo, useMemo, useState, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import {
	BlockControls,
	BlockContextProvider,
	__experimentalUseBlockPreview as useBlockPreview,
	__experimentalBlockVariationPicker as BlockVariationPicker,
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useEntityRecords } from '@wordpress/core-data';
import {
	PanelBody,
	ToolbarGroup,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { list, grid } from '@wordpress/icons';
import {
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
} from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';

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

/**
 * Builds a hierarchical tree structure from flat terms array.
 *
 * @param {Array} terms Array of term objects.
 * @return {Array} Tree structure with parent/child relationships.
 */
function buildTermsTree( terms ) {
	const termsById = {};
	const rootTerms = [];

	terms.forEach( ( term ) => {
		termsById[ term.id ] = {
			term,
			children: [],
		};
	} );

	terms.forEach( ( term ) => {
		if ( term.parent && termsById[ term.parent ] ) {
			termsById[ term.parent ].children.push( termsById[ term.id ] );
		} else {
			rootTerms.push( termsById[ term.id ] );
		}
	} );

	return rootTerms;
}

/**
 * Renders a single term node and its children recursively.
 *
 * @param {Object}   termNode   Term node with term object and children.
 * @param {Function} renderTerm Function to render individual terms.
 * @return {JSX.Element} Rendered term node with children.
 */
function renderTermNode( termNode, renderTerm ) {
	return (
		<li className="wp-block-term">
			{ renderTerm( termNode.term ) }
			{ termNode.children.length > 0 && (
				<ul>
					{ termNode.children.map( ( child ) =>
						renderTermNode( child, renderTerm )
					) }
				</ul>
			) }
		</li>
	);
}

/**
 * Checks if a term is the currently active term.
 *
 * @param {number} termId               The term ID to check.
 * @param {number} activeBlockContextId The currently active block context ID.
 * @param {Array}  blockContexts        Array of block contexts.
 * @return {boolean} True if the term is active, false otherwise.
 */
function isActiveTerm( termId, activeBlockContextId, blockContexts ) {
	return termId === ( activeBlockContextId || blockContexts[ 0 ]?.termId );
}

export default function TermTemplateEdit( {
	clientId,
	attributes,
	setAttributes,
	context: {
		termQuery: {
			taxonomy,
			order,
			orderBy,
			hideEmpty,
			hierarchical,
			parent,
			perPage = 10,
		} = {},
	},
	__unstableLayoutClassNames,
} ) {
	const [ activeBlockContextId, setActiveBlockContextId ] = useState();
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const { type: layoutType } = attributes?.layout || {};

	// Switch to list if hierarchical is true and grid is selected.
	useEffect( () => {
		if ( hierarchical && layoutType === 'grid' ) {
			setAttributes( {
				layout: { type: 'default' },
			} );
		}
	}, [ hierarchical, layoutType, setAttributes ] );

	const queryArgs = {
		order,
		orderby: orderBy,
		hide_empty: hideEmpty,
		// To preview the data the closest to the frontend, we fetch the largest number of terms
		// and limit them during rendering. This is because WP_Term_Query fetches data in hierarchical manner,
		// while in editor we build the hierarchy manually. It also allows us to avoid re-fetching data when max terms changes.
		per_page: 100,
	};

	const { records: terms, isResolving } = useEntityRecords(
		'taxonomy',
		taxonomy,
		queryArgs
	);

	// Filter to show only top-level terms if "Show only top-level terms" is enabled.
	const filteredTerms = useMemo( () => {
		if ( ! terms || parent !== 0 ) {
			return terms;
		}
		return terms.filter( ( term ) => ! term.parent );
	}, [ terms, parent ] );

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
					icon="layout"
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

	const setDisplayLayout = ( newDisplayLayout ) =>
		setAttributes( {
			layout: { ...attributes?.layout, ...newDisplayLayout },
		} );

	const displayLayoutControls = [
		{
			icon: list,
			title: _x( 'List view', 'Term template block display setting' ),
			onClick: () => setDisplayLayout( { type: 'default' } ),
			isActive: layoutType === 'default' || layoutType === 'constrained',
		},
		{
			icon: grid,
			title: _x( 'Grid view', 'Term template block display setting' ),
			onClick: () =>
				setDisplayLayout( {
					type: 'grid',
				} ),
			isActive: layoutType === 'grid',
			disabled: hierarchical,
		},
	];

	const renderTerm = ( term ) => {
		const blockContext = {
			taxonomy,
			termId: term.id,
			classList: `term-${ term.id }`,
			termData: term,
		};

		return (
			<BlockContextProvider key={ term.id } value={ blockContext }>
				{ isActiveTerm(
					term.id,
					activeBlockContextId,
					blockContexts
				) ? (
					<TermTemplateInnerBlocks
						classList={ blockContext.classList }
					/>
				) : null }
				<MemoizedTermTemplateBlockPreview
					blocks={ blocks }
					blockContextId={ term.id }
					classList={ blockContext.classList }
					setActiveBlockContextId={ setActiveBlockContextId }
					isHidden={ isActiveTerm(
						term.id,
						activeBlockContextId,
						blockContexts
					) }
				/>
			</BlockContextProvider>
		);
	};

	return (
		<>
			<BlockControls>
				<ToolbarGroup controls={ displayLayoutControls } />
			</BlockControls>

			<ul { ...blockProps }>
				{ hierarchical
					? buildTermsTree( filteredTerms ).map( ( termNode ) =>
							renderTermNode( termNode, renderTerm )
					  )
					: blockContexts &&
					  blockContexts
							.slice( 0, perPage )
							.map( ( blockContext ) => (
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

export const withStylesControlsOnTop = ( BlockEdit ) => ( props ) => {
	if ( props.name !== 'core/term-template' ) {
		return <BlockEdit key="edit" { ...props } />;
	}

	const { attributes, context, setAttributes } = props;
	const {
		termQuery: { hierarchical },
	} = context;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Style' ) }>
					<ToggleGroupControl
						label={ __( 'Display Layout' ) }
						value={
							attributes?.layout?.type === 'grid'
								? 'grid'
								: 'list'
						}
						help={
							hierarchical
								? __(
										'Grid view is not available when the "Show hierarchy" setting is enabled.'
								  )
								: undefined
						}
						onChange={ ( value ) => {
							if ( value === 'grid' ) {
								setAttributes( {
									layout: { type: 'grid' },
								} );
							} else {
								setAttributes( {
									layout: { type: 'default' },
								} );
							}
						} }
						isBlock
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						disabled={ hierarchical }
					>
						<ToggleGroupControlOption
							value="list"
							label={ __( 'List' ) }
						/>
						<ToggleGroupControlOption
							value="grid"
							label={ __( 'Grid' ) }
							disabled={ hierarchical }
						/>
					</ToggleGroupControl>
				</PanelBody>
			</InspectorControls>
			<BlockEdit key="edit" { ...props } />
		</>
	);
};

addFilter( 'editor.BlockEdit', 'core/term-template', withStylesControlsOnTop );
