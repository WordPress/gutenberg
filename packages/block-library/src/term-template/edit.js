/**
 * External dependencies
 */
import clsx from 'clsx';

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
		} = {},
	},
	__unstableLayoutClassNames,
} ) {
	const { type: layoutType, columnCount = 3 } = layout || {};
	const [ activeBlockContextId, setActiveBlockContextId ] = useState();

	const queryArgs = {
		hide_empty: hideEmpty,
		order,
		orderby: orderBy,
		per_page: perPage,
	};

	// Nested terms are returned by default from REST API as long as parent is not set.
	// If we want to show nested terms, we must not set parent at all.
	if ( ! showNested && ! include?.length ) {
		queryArgs.parent = 0;
	}

	if ( include?.length ) {
		queryArgs.include = include;
		// If we are using `include` update the `order` and `orderby` arguments to preserve the order.
		queryArgs.orderby = 'include';
		queryArgs.order = 'asc';
	}

	const { records: terms } = useEntityRecords(
		'taxonomy',
		taxonomy,
		queryArgs
	);

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
				taxonomy,
				termId: term.id,
				classList: `term-${ term.id }`,
				termData: term,
			} ) ),
		[ terms, taxonomy ]
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
