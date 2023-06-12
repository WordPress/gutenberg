/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useMemo, useRef, memo } from '@wordpress/element';
import {
	createBlock,
	createBlocksFromInnerBlocksTemplate,
	isReusableBlock,
	isTemplatePart,
} from '@wordpress/blocks';
import { __experimentalTruncate as Truncate } from '@wordpress/components';
import { ENTER, isAppleOS } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import { InserterListboxItem } from '../inserter-listbox';
import InserterDraggableBlocks from '../inserter-draggable-blocks';

function InserterListItem( {
	className,
	isFirst,
	item,
	onSelect,
	onHover,
	isDraggable,
	...props
} ) {
	const isDragging = useRef( false );
	const itemIconStyle = item.icon
		? {
				backgroundColor: item.icon.background,
				color: item.icon.foreground,
		  }
		: {};
	const blocks = useMemo( () => {
		return [
			createBlock(
				item.name,
				item.initialAttributes,
				createBlocksFromInnerBlocksTemplate( item.innerBlocks )
			),
		];
	}, [ item.name, item.initialAttributes, item.initialAttributes ] );

	const isSynced = isReusableBlock( item ) || isTemplatePart( item );

	return (
		<InserterDraggableBlocks
			isEnabled={ isDraggable && ! item.disabled }
			blocks={ blocks }
			icon={ item.icon }
		>
			{ ( { draggable, onDragStart, onDragEnd } ) => (
				<div
					className={ classnames(
						'block-editor-block-types-list__list-item',

						{
							'is-synced': isSynced,
						}
					) }
					draggable={ draggable }
					onDragStart={ ( event ) => {
						isDragging.current = true;
						if ( onDragStart ) {
							onHover( null );
							onDragStart( event );
						}
					} }
					onDragEnd={ ( event ) => {
						isDragging.current = false;
						if ( onDragEnd ) {
							onDragEnd( event );
						}
					} }
				>
					<InserterListboxItem
						isFirst={ isFirst }
						className={ classnames(
							'block-editor-block-types-list__item',
							className
						) }
						disabled={ item.isDisabled }
						onClick={ ( event ) => {
							event.preventDefault();
							onSelect(
								item,
								isAppleOS() ? event.metaKey : event.ctrlKey
							);
							onHover( null );
						} }
						onKeyDown={ ( event ) => {
							const { keyCode } = event;
							if ( keyCode === ENTER ) {
								event.preventDefault();
								onSelect(
									item,
									isAppleOS() ? event.metaKey : event.ctrlKey
								);
								onHover( null );
							}
						} }
						onMouseEnter={ () => {
							if ( isDragging.current ) {
								return;
							}
							onHover( item );
						} }
						onMouseLeave={ () => onHover( null ) }
						{ ...props }
					>
						<span
							className="block-editor-block-types-list__item-icon"
							style={ itemIconStyle }
						>
							<BlockIcon icon={ item.icon } showColors />
						</span>
						<span className="block-editor-block-types-list__item-title">
							<Truncate numberOfLines={ 3 }>
								{ item.title }
							</Truncate>
						</span>
					</InserterListboxItem>
				</div>
			) }
		</InserterDraggableBlocks>
	);
}

export default memo( InserterListItem );
