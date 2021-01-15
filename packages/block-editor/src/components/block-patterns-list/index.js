/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { VisuallyHidden } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';
import InserterDraggableBlocks from '../inserter-draggable-blocks';

function BlockPattern( { isDraggable, pattern, onClick } ) {
	const { content, viewportWidth } = pattern;
	const blocks = useMemo( () => parse( content ), [ content ] );
	const instanceId = useInstanceId( BlockPattern );
	const descriptionId = `block-editor-block-patterns-list__item-description-${ instanceId }`;

	return (
		<InserterDraggableBlocks isEnabled={ isDraggable } blocks={ blocks }>
			{ ( { draggable, onDragStart, onDragEnd } ) => (
				<div
					className="block-editor-block-patterns-list__item"
					role="button"
					onClick={ () => onClick( pattern, blocks ) }
					onKeyDown={ ( event ) => {
						if (
							ENTER === event.keyCode ||
							SPACE === event.keyCode
						) {
							onClick( pattern, blocks );
						}
					} }
					tabIndex={ 0 }
					aria-label={ pattern.title }
					aria-describedby={
						pattern.description ? descriptionId : undefined
					}
					draggable={ draggable }
					onDragStart={ onDragStart }
					onDragEnd={ onDragEnd }
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
} ) {
	return blockPatterns.map( ( pattern ) => {
		const isShown = shownPatterns.includes( pattern );
		return isShown ? (
			<BlockPattern
				key={ pattern.name }
				pattern={ pattern }
				onClick={ onClickPattern }
				isDraggable={ isDraggable }
			/>
		) : (
			<BlockPatternPlaceholder key={ pattern.name } />
		);
	} );
}

export default BlockPatternList;
