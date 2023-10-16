/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, forwardRef } from '@wordpress/element';
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
	showTooltip,
} ) {
	const [ isDragging, setIsDragging ] = useState( false );
	const { blocks, viewportWidth } = pattern;
	const instanceId = useInstanceId( BlockPattern );
	const descriptionId = `block-editor-block-patterns-list__item-description-${ instanceId }`;

	return (
		<InserterDraggableBlocks
			isEnabled={ isDraggable }
			blocks={ blocks }
			isPattern={ !! pattern }
		>
			{ ( { draggable, onDragStart, onDragEnd } ) => (
				<div
					role="listitem"
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
						showTooltip={ showTooltip && ! pattern.id }
						title={ pattern.title }
					>
						<CompositeItem
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
							render={
								<div
									role="button"
									className={ classnames(
										'block-editor-block-patterns-list__item',
										{
											'block-editor-block-patterns-list__list-item-synced':
												pattern.id &&
												! pattern.syncStatus,
										}
									) }
									aria-label={ pattern.title }
									aria-describedby={
										pattern.description
											? descriptionId
											: undefined
									}
								/>
							}
						>
							<BlockPreview
								blocks={ blocks }
								viewportWidth={ viewportWidth }
							/>

							<HStack className="block-editor-patterns__pattern-details">
								{ pattern.id && ! pattern.syncStatus && (
									<div className="block-editor-patterns__pattern-icon-wrapper">
										<Icon
											className="block-editor-patterns__pattern-icon"
											icon={ symbol }
										/>
									</div>
								) }
								{ ( ! showTooltip || pattern.id ) && (
									<div className="block-editor-block-patterns-list__item-title">
										{ pattern.title }
									</div>
								) }
							</HStack>

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

function BlockPatternList(
	{
		isDraggable,
		blockPatterns,
		shownPatterns,
		onHover,
		onClickPattern,
		orientation,
		label = __( 'Block patterns' ),
		showTitlesAsTooltip,
		pagingProps,
	},
	ref
) {
	const composite = useCompositeStore( {
		orientation,
		setItems: ( items ) => {
			// This is necessary for if/when we filter the block patterns;
			// we can potentially remove the currently active item, so we
			// check to see if the active item is still present, and if not,
			// reset the it to be the first available block.

			const currentIds = items.map( ( item ) => item.id );
			if ( ! currentIds.includes( activeId ) ) {
				// We can't rely on the order of `currentIds` here, because
				// `blockPatterns` may not be in the same order the blocks were
				// originally registered in. So we filter the blocks by what's
				// visible, and take the first item in that list instead.
				const firstPattern = blockPatterns.filter( ( pattern ) =>
					currentIds.includes( pattern.name )
				)[ 0 ];
				composite.setActiveId( firstPattern?.name );
			}
		},
	} );

	const activeId = composite.useState( 'activeId' );

	return (
		<Composite
			store={ composite }
			render={
				<div
					ref={ ref }
					role="list"
					className="block-editor-block-patterns-list"
					aria-label={ label }
				/>
			}
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
						showTooltip={ showTitlesAsTooltip }
					/>
				) : (
					<BlockPatternPlaceholder key={ pattern.name } />
				);
			} ) }
			{ pagingProps && <BlockPatternsPaging { ...pagingProps } /> }
		</Composite>
	);
}

export default forwardRef( BlockPatternList );
