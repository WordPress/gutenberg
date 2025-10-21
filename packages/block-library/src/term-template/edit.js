/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import { useCurrentTerm } from './use-current-term';

/**
 * WordPress dependencies
 */
import { ToolbarGroup } from '@wordpress/components';
import { list, grid } from '@wordpress/icons';
import { memo, useMemo, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import {
	BlockControls,
	BlockContextProvider,
	__experimentalUseBlockPreview as useBlockPreview,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useEntityRecords } from '@wordpress/core-data';

const TEMPLATE = [ [ 'core/term-name' ] ];

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
	attributes: { layout },
	setAttributes,
	context: {
		termQuery: {
			taxonomy,
			order,
			orderBy,
			hideEmpty,
			showNested = false,
			perPage,
			include,
			inherit = false,
		} = {},
	},
	__unstableLayoutClassNames,
} ) {
	const { type: layoutType, columnCount = 3 } = layout || {};
	const [ activeBlockContextId, setActiveBlockContextId ] = useState();

	// Extract current term from template slug when inheriting.
	const currentTerm = useCurrentTerm( inherit );

	const queryArgs = {
		hide_empty: hideEmpty,
		order,
		orderby: orderBy,
		// There is a mismatch between `WP_Term_Query` and the REST API parameter default
		// values to fetch all items. In `WP_Term_Query`, the default is `''|0` and in
		// the REST API is `-1`.
		per_page: perPage || -1,
	};

	// Handle inherit logic.
	if ( inherit && currentTerm ) {
		// When inheriting, use the current term's taxonomy.
		queryArgs.taxonomy = currentTerm.taxonomy;

		// For hierarchical taxonomies, show children of the current term.
		// If showNested is true, use child_of to include nested terms.
		// Otherwise, use parent to show only direct children.
		if ( showNested ) {
			// For nested terms, we need to fetch all terms and filter client-side
			// since the REST API doesn't support child_of like WP_Term_Query does.
			// Don't set parent - we'll filter the results after fetching.
		} else {
			queryArgs.parent = currentTerm.id;
		}
	} else if ( ! showNested && ! include?.length ) {
		// Nested terms are returned by default from REST API as long as parent is not set.
		// Set parent to 0 to show only top-level terms.
		queryArgs.parent = 0;
	}

	if ( include?.length ) {
		queryArgs.include = include;
		// If we are using `include` update the `order` and `orderby` arguments to preserve the order.
		queryArgs.orderby = 'include';
		queryArgs.order = 'asc';
	}

	// Use the taxonomy from queryArgs if it was set (for inherit), otherwise use the context taxonomy.
	const currentTaxonomy = queryArgs.taxonomy || taxonomy;

	const { records: allTerms } = useEntityRecords(
		'taxonomy',
		currentTaxonomy,
		queryArgs
	);

	// Filter terms for nested functionality.
	const terms = useMemo( () => {
		if ( ! allTerms || ! inherit || ! currentTerm ) {
			return allTerms;
		}

		if ( showNested ) {
			// For nested terms, filter to show all descendants of the current term.
			const isDescendant = ( term ) => {
				// Check if this term is a descendant of the current term.
				const findParent = ( termId ) => {
					const foundTerm = allTerms.find( ( t ) => t.id === termId );
					return foundTerm ? foundTerm.parent : 0;
				};

				let currentParent = term.parent;
				while ( currentParent !== 0 ) {
					if ( currentParent === currentTerm.id ) {
						return true;
					}
					currentParent = findParent( currentParent );
				}
				return false;
			};

			return allTerms.filter( isDescendant );
		}

		return allTerms;
	}, [ allTerms, inherit, currentTerm, showNested ] );

	const blocks = useSelect(
		( select ) => select( blockEditorStore ).getBlocks( clientId ),
		[ clientId ]
	);
	const blockProps = useBlockProps( {
		className: __unstableLayoutClassNames,
	} );
	const blockContexts = useMemo(
		() =>
			terms?.map( ( term ) => ( {
				taxonomy: currentTaxonomy,
				termId: term.id,
				classList: `term-${ term.id }`,
				termData: term,
			} ) ),
		[ terms, currentTaxonomy ]
	);

	if ( ! terms ) {
		return (
			<ul { ...blockProps }>
				<li className="wp-block-term term-loading">
					<div className="term-loading-placeholder" />
				</li>
			</ul>
		);
	}

	if ( ! terms.length ) {
		return <p { ...blockProps }> { __( 'No terms found.' ) }</p>;
	}

	const setDisplayLayout = ( newDisplayLayout ) =>
		setAttributes( ( prevAttributes ) => ( {
			layout: { ...prevAttributes.layout, ...newDisplayLayout },
		} ) );

	return (
		<>
			<BlockControls>
				<ToolbarGroup
					controls={ [
						{
							icon: list,
							title: _x(
								'List view',
								'Term template block display setting'
							),
							onClick: () =>
								setDisplayLayout( { type: 'default' } ),
							isActive:
								layoutType === 'default' ||
								layoutType === 'constrained',
						},
						{
							icon: grid,
							title: _x(
								'Grid view',
								'Term template block display setting'
							),
							onClick: () =>
								setDisplayLayout( {
									type: 'grid',
									columnCount,
								} ),
							isActive: layoutType === 'grid',
						},
					] }
				/>
			</BlockControls>
			<ul { ...blockProps }>
				{ blockContexts?.map( ( blockContext ) => (
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
							setActiveBlockContextId={ setActiveBlockContextId }
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
