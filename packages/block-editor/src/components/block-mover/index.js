/**
 * External dependencies
 */
import { first, last, partial } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, ToolbarGroup } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { getBlockMoverDescription } from './mover-description';
import { leftArrow, rightArrow } from './icons';
import { chevronUp, chevronDown } from '@wordpress/icons';
import BlockDraggable from '../block-draggable';

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
		const {
			onMoveUp,
			onMoveDown,
			__experimentalOrientation: orientation,
			isRTL,
			isFirst,
			isLast,
			clientIds,
			blockType,
			firstIndex,
			isLocked,
			instanceId,
			isHidden,
			rootClientId,
			hideDragHandle,
		} = this.props;
		const { isFocused } = this.state;
		const blocksCount = clientIds.length;
		if ( isLocked || ( isFirst && isLast && ! rootClientId ) ) {
			return null;
		}

		const getArrowIcon = ( moveDirection ) => {
			if ( moveDirection === 'up' ) {
				if ( orientation === 'horizontal' ) {
					return isRTL ? rightArrow : leftArrow;
				}
				return chevronUp;
			} else if ( moveDirection === 'down' ) {
				if ( orientation === 'horizontal' ) {
					return isRTL ? leftArrow : rightArrow;
				}
				return chevronDown;
			}
			return null;
		};

		const getMovementDirectionLabel = ( moveDirection ) => {
			if ( moveDirection === 'up' ) {
				if ( orientation === 'horizontal' ) {
					return isRTL ? __( 'Move right' ) : __( 'Move left' );
				}
				return __( 'Move up' );
			} else if ( moveDirection === 'down' ) {
				if ( orientation === 'horizontal' ) {
					return isRTL ? __( 'Move left' ) : __( 'Move right' );
				}
				return __( 'Move down' );
			}
			return null;
		};

		// We emulate a disabled state because forcefully applying the `disabled`
		// attribute on the buttons while it has focus causes the screen to change
		// to an unfocused state (body as active element) without firing blur on,
		// the rendering parent, leaving it unable to react to focus out.
		return (
			<BlockDraggable clientIds={ clientIds }>
				{ ( { isDraggable, onDraggableStart, onDraggableEnd } ) => (
					<div
						className={ classnames( 'block-editor-block-mover', {
							'is-visible': isFocused || ! isHidden,
							'is-horizontal': orientation === 'horizontal',
						} ) }
						draggable={ isDraggable && ! hideDragHandle }
						onDragStart={ onDraggableStart }
						onDragEnd={ onDraggableEnd }
					>
						<ToolbarGroup>
							<Button
								className="block-editor-block-mover__control block-editor-block-mover__control-up"
								onClick={ isFirst ? null : onMoveUp }
								icon={ getArrowIcon( 'up' ) }
								label={ getMovementDirectionLabel( 'up' ) }
								aria-describedby={ `block-editor-block-mover__up-description-${ instanceId }` }
								aria-disabled={ isFirst }
								onFocus={ this.onFocus }
								onBlur={ this.onBlur }
							/>

							<Button
								className="block-editor-block-mover__control block-editor-block-mover__control-down"
								onClick={ isLast ? null : onMoveDown }
								icon={ getArrowIcon( 'down' ) }
								label={ getMovementDirectionLabel( 'down' ) }
								aria-describedby={ `block-editor-block-mover__down-description-${ instanceId }` }
								aria-disabled={ isLast }
								onFocus={ this.onFocus }
								onBlur={ this.onBlur }
							/>
							<span
								id={ `block-editor-block-mover__up-description-${ instanceId }` }
								className="block-editor-block-mover__description"
							>
								{ getBlockMoverDescription(
									blocksCount,
									blockType && blockType.title,
									firstIndex,
									isFirst,
									isLast,
									-1,
									orientation,
									isRTL
								) }
							</span>
							<span
								id={ `block-editor-block-mover__down-description-${ instanceId }` }
								className="block-editor-block-mover__description"
							>
								{ getBlockMoverDescription(
									blocksCount,
									blockType && blockType.title,
									firstIndex,
									isFirst,
									isLast,
									1,
									orientation,
									isRTL
								) }
							</span>
						</ToolbarGroup>
					</div>
				) }
			</BlockDraggable>
		);
	}
}

export default compose(
	withSelect( ( select, { clientIds } ) => {
		const {
			getBlock,
			getBlockIndex,
			getTemplateLock,
			getBlockRootClientId,
			getBlockOrder,
		} = select( 'core/block-editor' );
		const firstClientId = first( clientIds );
		const block = getBlock( firstClientId );
		const rootClientId = getBlockRootClientId( first( clientIds ) );
		const blockOrder = getBlockOrder( rootClientId );
		const firstIndex = getBlockIndex( firstClientId, rootClientId );
		const lastIndex = getBlockIndex( last( clientIds ), rootClientId );
		const { getSettings } = select( 'core/block-editor' );
		const { isRTL } = getSettings();

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
		const { moveBlocksDown, moveBlocksUp } = dispatch(
			'core/block-editor'
		);
		return {
			onMoveDown: partial( moveBlocksDown, clientIds, rootClientId ),
			onMoveUp: partial( moveBlocksUp, clientIds, rootClientId ),
		};
	} ),
	withInstanceId
)( BlockMover );
