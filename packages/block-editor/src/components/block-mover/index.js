/**
 * External dependencies
 */
import { first, last, partial, castArray } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { getBlockMoverDescription } from './mover-description';
import { leftArrow, rightArrow, upArrow, downArrow, dragHandle } from './icons';
import { IconDragHandle } from './drag-handle';

export class BlockMover extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isFocused: false,
		};
		this.onFocus = this.onFocus.bind( this );
		this.onBlur = this.onBlur.bind( this );
	}

	onFocus() {
		this.setState( {
			isFocused: true,
		} );
	}

	onBlur() {
		this.setState( {
			isFocused: false,
		} );
	}

	render() {
		const { onMoveUp, onMoveDown, __experimentalOrientation: orientation, isRTL, isFirst, isLast, isDraggable, onDragStart, onDragEnd, clientIds, blockElementId, blockType, firstIndex, isLocked, instanceId, isHidden, rootClientId } = this.props;
		const { isFocused } = this.state;
		const blocksCount = castArray( clientIds ).length;
		if ( isLocked || ( isFirst && isLast && ! rootClientId ) ) {
			return null;
		}

		const getArrowIcon = ( moveDirection ) => {
			if ( moveDirection === 'up' ) {
				if ( orientation === 'horizontal' ) {
					return isRTL ? rightArrow : leftArrow;
				}
				return upArrow;
			} else if ( moveDirection === 'down' ) {
				if ( orientation === 'horizontal' ) {
					return isRTL ? leftArrow : rightArrow;
				}
				return downArrow;
			}
			return null;
		};

		const getMovementDirection = ( moveDirection ) => {
			if ( moveDirection === 'up' ) {
				if ( orientation === 'horizontal' ) {
					return isRTL ? 'right' : 'left';
				}
				return 'up';
			} else if ( moveDirection === 'down' ) {
				if ( orientation === 'horizontal' ) {
					return isRTL ? 'left' : 'right';
				}
				return 'down';
			}
			return null;
		};

		// We emulate a disabled state because forcefully applying the `disabled`
		// attribute on the button while it has focus causes the screen to change
		// to an unfocused state (body as active element) without firing blur on,
		// the rendering parent, leaving it unable to react to focus out.
		return (
			<div className={ classnames( 'editor-block-mover block-editor-block-mover', { 'is-visible': isFocused || ! isHidden, 'is-horizontal': orientation === 'horizontal' } ) }>
				<IconButton
					className="editor-block-mover__control block-editor-block-mover__control"
					onClick={ isFirst ? null : onMoveUp }
					icon={ getArrowIcon( 'up' ) }
					// translators: %s: Horizontal direction of block movement ( left, right )
					label={ sprintf( __( 'Move %s' ), getMovementDirection( 'up' ) ) }
					aria-describedby={ `block-editor-block-mover__up-description-${ instanceId }` }
					aria-disabled={ isFirst }
					onFocus={ this.onFocus }
					onBlur={ this.onBlur }
				/>
				<IconDragHandle
					className="editor-block-mover__control block-editor-block-mover__control"
					icon={ dragHandle }
					clientId={ clientIds }
					blockElementId={ blockElementId }
					isVisible={ isDraggable }
					onDragStart={ onDragStart }
					onDragEnd={ onDragEnd }
				/>
				<IconButton
					className="editor-block-mover__control block-editor-block-mover__control"
					onClick={ isLast ? null : onMoveDown }
					icon={ getArrowIcon( 'down' ) }
					// translators: %s: Horizontal direction of block movement ( left, right )
					label={ sprintf( __( 'Move %s' ), getMovementDirection( 'down' ) ) }
					aria-describedby={ `block-editor-block-mover__down-description-${ instanceId }` }
					aria-disabled={ isLast }
					onFocus={ this.onFocus }
					onBlur={ this.onBlur }
				/>
				<span id={ `block-editor-block-mover__up-description-${ instanceId }` } className="editor-block-mover__description block-editor-block-mover__description">
					{
						getBlockMoverDescription(
							blocksCount,
							blockType && blockType.title,
							firstIndex,
							isFirst,
							isLast,
							-1,
							orientation,
							isRTL,
						)
					}
				</span>
				<span id={ `block-editor-block-mover__down-description-${ instanceId }` } className="editor-block-mover__description block-editor-block-mover__description">
					{
						getBlockMoverDescription(
							blocksCount,
							blockType && blockType.title,
							firstIndex,
							isFirst,
							isLast,
							1,
							orientation,
							isRTL,
						)
					}
				</span>
			</div>
		);
	}
}

export default compose(
	withSelect( ( select, { clientIds } ) => {
		const { getBlock, getBlockIndex, getTemplateLock, getBlockRootClientId, getBlockOrder } = select( 'core/block-editor' );
		const normalizedClientIds = castArray( clientIds );
		const firstClientId = first( normalizedClientIds );
		const block = getBlock( firstClientId );
		const rootClientId = getBlockRootClientId( first( normalizedClientIds ) );
		const blockOrder = getBlockOrder( rootClientId );
		const firstIndex = getBlockIndex( firstClientId, rootClientId );
		const lastIndex = getBlockIndex( last( normalizedClientIds ), rootClientId );
		const { getSettings } = select( 'core/block-editor' );
		const {
			isRTL,
		} = getSettings();

		return {
			blockType: block ? getBlockType( block.name ) : null,
			isLocked: getTemplateLock( rootClientId ) === 'all',
			rootClientId,
			firstIndex,
			isRTL,
			isFirst: firstIndex === 0,
			isLast: lastIndex === blockOrder.length - 1,
		};
	} ),
	withDispatch( ( dispatch, { clientIds, rootClientId } ) => {
		const { moveBlocksDown, moveBlocksUp } = dispatch( 'core/block-editor' );
		return {
			onMoveDown: partial( moveBlocksDown, clientIds, rootClientId ),
			onMoveUp: partial( moveBlocksUp, clientIds, rootClientId ),
		};
	} ),
	withInstanceId,
)( BlockMover );
