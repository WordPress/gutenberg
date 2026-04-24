/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { cloneBlock } from '@wordpress/blocks';
import { useEffect, useState, forwardRef, useMemo } from '@wordpress/element';
import {
	Composite,
	VisuallyHidden,
	Tooltip,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Icon, symbol } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';
import InserterDraggableBlocks from '../inserter-draggable-blocks';
import BlockPatternsPaging from '../block-patterns-paging';
import { INSERTER_PATTERN_TYPES } from '../inserter/block-patterns-tab/utils';

const WithToolTip = ( { showTooltip, title, children } ) => {
	if ( showTooltip ) {
		return <Tooltip text={ title }>{ children }</Tooltip>;
	}
	return <>{ children }</>;
};

function BlockPattern( {
	id,
	isDraggable,
	pattern,
	onClick,
	onHover,
	showTitlesAsTooltip,
	category,
	isSelected,
} ) {
	const [ isDragging, setIsDragging ] = useState( false );
	const { blocks, viewportWidth } = pattern;
	const instanceId = useInstanceId( BlockPattern );
	const descriptionId = `block-editor-block-patterns-list__item-description-${ instanceId }`;
	const isUserPattern = pattern.type === INSERTER_PATTERN_TYPES.user;

	// When we have a selected category and the pattern is draggable, we need to update the
	// pattern's categories in metadata to only contain the selected category, and pass this to
	// InserterDraggableBlocks component. We do that because we use this information for pattern
	// shuffling and it makes more sense to show only the ones from the initially selected category during insertion.
	const patternBlocks = useMemo( () => {
		if ( ! category || ! isDraggable ) {
			return blocks;
		}
		return ( blocks ?? [] ).map( ( block ) => {
			const clonedBlock = cloneBlock( block );
			if (
				clonedBlock.attributes.metadata?.categories?.includes(
					category
				)
			) {
				clonedBlock.attributes.metadata.categories = [ category ];
			}
			return clonedBlock;
		} );
	}, [ blocks, isDraggable, category ] );

	return (
		<InserterDraggableBlocks
			isEnabled={ isDraggable }
			blocks={ patternBlocks }
			pattern={ pattern }
		>
			{ ( { draggable, onDragStart, onDragEnd } ) => (
				<div
					className="block-editor-block-patterns-list__list-item"
					draggable={ draggable }
					onDragStart={ ( event ) => {
						setIsDragging( true );
						if ( onDragStart ) {
							onHover?.( null );
							onDragStart( event );
						}
					} }
					onDragEnd={ ( event ) => {
						setIsDragging( false );
						if ( onDragEnd ) {
							onDragEnd( event );
						}
					} }
				>
					<WithToolTip
						showTooltip={ showTitlesAsTooltip && ! isUserPattern }
						title={ pattern.title }
					>
						<Composite.Item
							render={
								<div
									role="option"
									aria-label={ pattern.title }
									aria-describedby={
										pattern.description
											? descriptionId
											: undefined
									}
									className={ clsx(
										'block-editor-block-patterns-list__item',
										{
											'block-editor-block-patterns-list__list-item-synced':
												pattern.type ===
													INSERTER_PATTERN_TYPES.user &&
												! pattern.syncStatus,
											'is-selected': isSelected,
										}
									) }
								/>
							}
							id={ id }
							onClick={ () => {
								onClick( pattern, blocks );
								onHover?.( null );
							} }
							onMouseEnter={ () => {
								if ( isDragging ) {
									return;
								}
								onHover?.( pattern );
							} }
							onMouseLeave={ () => onHover?.( null ) }
						>
							<BlockPreview.Async
								placeholder={ <BlockPatternPlaceholder /> }
							>
								<BlockPreview
									blocks={ blocks }
									viewportWidth={ viewportWidth }
								/>
							</BlockPreview.Async>
							{ ( ! showTitlesAsTooltip || isUserPattern ) && (
								<HStack
									className="block-editor-patterns__pattern-details"
									spacing={ 2 }
								>
									{ isUserPattern && ! pattern.syncStatus && (
										<div className="block-editor-patterns__pattern-icon-wrapper">
											<Icon
												className="block-editor-patterns__pattern-icon"
												icon={ symbol }
											/>
										</div>
									) }
									<div className="block-editor-block-patterns-list__item-title">
										{ pattern.title }
									</div>
								</HStack>
							) }

							{ !! pattern.description && (
								<VisuallyHidden id={ descriptionId }>
									{ pattern.description }
								</VisuallyHidden>
							) }
						</Composite.Item>
					</WithToolTip>
				</div>
			) }
		</InserterDraggableBlocks>
	);
}

function BlockPatternPlaceholder() {
	return (
		<div className="block-editor-block-patterns-list__item is-placeholder" />
	);
}

function BlockPatternsList(
	{
		isDraggable,
		blockPatterns,
		onHover,
		onClickPattern,
		orientation,
		label = __( 'Block patterns' ),
		category,
		showTitlesAsTooltip,
		pagingProps,
	},
	ref
) {
	const [ activeCompositeId, setActiveCompositeId ] = useState( undefined );
	const [ activePattern, setActivePattern ] = useState( null ); // State to track active pattern

	useEffect( () => {
		// Reset the active composite item whenever the available patterns change,
		// to make sure that Composite widget can receive focus correctly when its
		// composite items change. The first composite item will receive focus.
		const firstCompositeItemId = blockPatterns[ 0 ]?.name;
		setActiveCompositeId( firstCompositeItemId );
	}, [ blockPatterns ] );

	const handleClickPattern = ( pattern, blocks ) => {
		setActivePattern( pattern.name );
		onClickPattern( pattern, blocks );
	};

	return (
		<Composite
			orientation={ orientation }
			activeId={ activeCompositeId }
			setActiveId={ setActiveCompositeId }
			role="listbox"
			className="block-editor-block-patterns-list"
			aria-label={ label }
			ref={ ref }
		>
			{ blockPatterns.map( ( pattern ) => (
				<BlockPattern
					key={ pattern.name }
					id={ pattern.name }
					pattern={ pattern }
					onClick={ handleClickPattern }
					onHover={ onHover }
					isDraggable={ isDraggable }
					showTitlesAsTooltip={ showTitlesAsTooltip }
					category={ category }
					isSelected={
						!! activePattern && activePattern === pattern.name
					}
				/>
			) ) }
			{ pagingProps && <BlockPatternsPaging { ...pagingProps } /> }
		</Composite>
	);
}

export default forwardRef( BlockPatternsList );
