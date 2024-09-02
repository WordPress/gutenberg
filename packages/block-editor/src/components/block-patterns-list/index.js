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
	VisuallyHidden,
	Tooltip,
	privateApis as componentsPrivateApis,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Icon, symbol } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import BlockPreview from '../block-preview';
import InserterDraggableBlocks from '../inserter-draggable-blocks';
import BlockPatternsPaging from '../block-patterns-paging';
import { INSERTER_PATTERN_TYPES } from '../inserter/block-patterns-tab/utils';

const {
	CompositeV2: Composite,
	CompositeItemV2: CompositeItem,
	useCompositeStoreV2: useCompositeStore,
} = unlock( componentsPrivateApis );

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
	showTitle = true,
	category,
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
						showTooltip={ ! showTitle && ! isUserPattern }
						title={ pattern.title }
					>
						<CompositeItem
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
							<BlockPreview
								blocks={ blocks }
								viewportWidth={ viewportWidth }
							/>

							{ ( showTitle || isUserPattern ) && (
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
						</CompositeItem>
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
		shownPatterns,
		onHover,
		onClickPattern,
		orientation,
		label = __( 'Block patterns' ),
		category,
		showTitle = true,
		pagingProps,
	},
	ref
) {
	const compositeStore = useCompositeStore( { orientation } );
	const { setActiveId } = compositeStore;

	useEffect( () => {
		// We reset the active composite item whenever the
		// available patterns change, to make sure that
		// focus is put back to the start.
		setActiveId( undefined );
	}, [ setActiveId, shownPatterns, blockPatterns ] );

	return (
		<Composite
			store={ compositeStore }
			role="listbox"
			className="block-editor-block-patterns-list"
			aria-label={ label }
			ref={ ref }
		>
			{ blockPatterns.map( ( pattern ) => {
				const isShown = shownPatterns.includes( pattern );
				return isShown ? (
					<BlockPattern
						key={ pattern.name }
						id={ pattern.name }
						pattern={ pattern }
						onClick={ onClickPattern }
						onHover={ onHover }
						isDraggable={ isDraggable }
						showTitle={ showTitle }
						category={ category }
					/>
				) : (
					<BlockPatternPlaceholder key={ pattern.name } />
				);
			} ) }
			{ pagingProps && <BlockPatternsPaging { ...pagingProps } /> }
		</Composite>
	);
}

export default forwardRef( BlockPatternsList );
