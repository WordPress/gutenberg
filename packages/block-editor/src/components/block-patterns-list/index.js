/**
 * WordPress dependencies
 */
import {
	VisuallyHidden,
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__unstableCompositeItem as CompositeItem,
	Tooltip,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import parsePattern from './parse-pattern';
import BlockPreview from '../block-preview';
import InserterDraggableBlocks from '../inserter-draggable-blocks';

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
	composite,
	showTooltip,
} ) {
	const { viewportWidth } = pattern;
	let { blocks } = pattern;
	// Fallback for patterns from Pattern Directory, that haven't been pre-parsed.
	if ( ! blocks ) {
		blocks = parsePattern( pattern );
	}
	const descriptionId = useInstanceId(
		BlockPattern,
		'block-editor-block-patterns-list__item-description'
	);
	return (
		<InserterDraggableBlocks
			isEnabled={ isDraggable }
			blocks={ blocks }
			isPattern={ !! pattern }
		>
			{ ( { draggable, onDragStart, onDragEnd } ) => {
				const patternTitle = decodeEntities( pattern.title );
				return (
					<div
						className="block-editor-block-patterns-list__list-item"
						draggable={ draggable }
						onDragStart={ onDragStart }
						onDragEnd={ onDragEnd }
					>
						<WithToolTip
							showTooltip={ showTooltip }
							title={ patternTitle }
						>
							<CompositeItem
								role="option"
								as="div"
								{ ...composite }
								className="block-editor-block-patterns-list__item"
								onClick={ () => onClick( pattern, blocks ) }
								aria-label={ patternTitle }
								aria-describedby={
									pattern.description
										? descriptionId
										: undefined
								}
							>
								<BlockPreview
									blocks={ blocks }
									viewportWidth={ viewportWidth }
								/>
								{ ! showTooltip && (
									<div className="block-editor-block-patterns-list__item-title">
										{ patternTitle }
									</div>
								) }
								{ !! pattern.description && (
									<VisuallyHidden id={ descriptionId }>
										{ pattern.description }
									</VisuallyHidden>
								) }
							</CompositeItem>
						</WithToolTip>
					</div>
				);
			} }
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
	showTitlesAsTooltip,
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
				const key = pattern.name || pattern.id;
				return isShown ? (
					<BlockPattern
						key={ key }
						pattern={ pattern }
						onClick={ onClickPattern }
						isDraggable={ isDraggable }
						composite={ composite }
						showTooltip={ showTitlesAsTooltip }
					/>
				) : (
					<BlockPatternPlaceholder key={ key } />
				);
			} ) }
		</Composite>
	);
}

export default BlockPatternList;
