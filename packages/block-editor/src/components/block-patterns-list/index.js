/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';
import {
	VisuallyHidden,
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__unstableCompositeItem as CompositeItem,
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
import usePatternsPaging from '../inserter/hooks/use-patterns-paging';

const WithToolTip = ( { showTooltip, title, children } ) => {
	if ( showTooltip ) {
		return <Tooltip text={ title }>{ children }</Tooltip>;
	}
	return <>{ children }</>;
};

function BlockPattern( {
	isDraggable,
	pattern,
	onClick,
	onHover,
	composite,
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
							role="option"
							as="div"
							{ ...composite }
							className={ classnames(
								'block-editor-block-patterns-list__item',
								{
									'block-editor-block-patterns-list__list-item-synced':
										pattern.id && ! pattern.syncStatus,
								}
							) }
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
							aria-label={ pattern.title }
							aria-describedby={
								pattern.description ? descriptionId : undefined
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

function BlockPatternList( {
	isDraggable,
	onHover,
	onClickPattern,
	orientation,
	label = __( 'Block Patterns' ),
	showTitlesAsTooltip,
	currentCategoryPatterns,
	category,
} ) {
	const composite = useCompositeState( { orientation } );
	const container = useRef();
	const pagingProps = usePatternsPaging(
		currentCategoryPatterns,
		category,
		container
	);
	const {
		categoryPatternsAsyncList: shownPatterns,
		categoryPatterns: blockPatterns,
	} = pagingProps;

	return (
		<Composite
			ref={ container }
			{ ...composite }
			role="listbox"
			className="block-editor-block-patterns-list"
			aria-label={ label }
		>
			{ blockPatterns.map( ( pattern ) => {
				const isShown = shownPatterns.includes( pattern );
				return isShown ? (
					<BlockPattern
						key={ pattern.name }
						pattern={ pattern }
						onClick={ onClickPattern }
						onHover={ onHover }
						isDraggable={ isDraggable }
						composite={ composite }
						showTooltip={ showTitlesAsTooltip }
					/>
				) : (
					<BlockPatternPlaceholder key={ pattern.name } />
				);
			} ) }
			{ pagingProps.numPages > 1 && (
				<BlockPatternsPaging { ...pagingProps } />
			) }
		</Composite>
	);
}

export default BlockPatternList;
