/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useEffect, useState, forwardRef } from '@wordpress/element';
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
						showTooltip={
							showTooltip &&
							! pattern.type !== INSERTER_PATTERN_TYPES.user
						}
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

							{ showTitle && (
								<HStack className="block-editor-patterns__pattern-details">
									{ pattern.type ===
										INSERTER_PATTERN_TYPES.user &&
										! pattern.syncStatus && (
											<div className="block-editor-patterns__pattern-icon-wrapper">
												<Icon
													className="block-editor-patterns__pattern-icon"
													icon={ symbol }
												/>
											</div>
										) }
									{ ( ! showTooltip ||
										pattern.type ===
											INSERTER_PATTERN_TYPES.user ) && (
										<div className="block-editor-block-patterns-list__item-title">
											{ pattern.title }
										</div>
									) }
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
		showTitle = true,
		showTitlesAsTooltip,
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

export default forwardRef( BlockPatternsList );
