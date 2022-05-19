/**
 * WordPress dependencies
 */
import {
	VisuallyHidden,
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__unstableCompositeItem as CompositeItem,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';
import InserterDraggableBlocks from '../inserter-draggable-blocks';

function BlockPattern( { isDraggable, pattern, onClick, composite } ) {
	const { blocks, viewportWidth } = pattern;
	const instanceId = useInstanceId( BlockPattern );
	const descriptionId = `block-editor-block-patterns-list__item-description-${ instanceId }`;

	return (
		<InserterDraggableBlocks isEnabled={ isDraggable } blocks={ blocks }>
			{ ( { draggable, onDragStart, onDragEnd } ) => (
				<div
					className="block-editor-block-patterns-list__list-item"
					aria-label={ pattern.title }
					aria-describedby={
						pattern.description ? descriptionId : undefined
					}
					draggable={ draggable }
					onDragStart={ onDragStart }
					onDragEnd={ onDragEnd }
				>
					<CompositeItem
						role="option"
						as="div"
						{ ...composite }
						className="block-editor-block-patterns-list__item"
						onClick={ () => onClick( pattern, blocks ) }
					>
						<BlockPreview
							blocks={ blocks }
							viewportWidth={ viewportWidth }
						/>
						<div className="block-editor-block-patterns-list__item-title">
							{ pattern.title }
						</div>
						{ !! pattern.description && (
							<VisuallyHidden id={ descriptionId }>
								{ pattern.description }
							</VisuallyHidden>
						) }
					</CompositeItem>
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
	blockPatterns,
	shownPatterns,
	onClickPattern,
	orientation,
	label = __( 'Block Patterns' ),
} ) {
	const composite = useCompositeState( { orientation } );
	return (
		<Composite
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
						isDraggable={ isDraggable }
						composite={ composite }
					/>
				) : (
					<BlockPatternPlaceholder key={ pattern.name } />
				);
			} ) }
		</Composite>
	);
}

export default BlockPatternList;
