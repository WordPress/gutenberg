/**
 * External dependencies
 */
import { first, partial } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, withContext, withInstanceId } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';
import { compose, Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import { getBlockMoverDescription } from './mover-description';
import { upArrow, downArrow } from './arrows';

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
		const { onMoveUp, onMoveDown, isFirst, isLast, uids, blockType, firstIndex, isLocked, instanceId, isHidden } = this.props;
		const { isFocused } = this.state;
		if ( isLocked ) {
			return null;
		}

		// We emulate a disabled state because forcefully applying the `disabled`
		// attribute on the button while it has focus causes the screen to change
		// to an unfocused state (body as active element) without firing blur on,
		// the rendering parent, leaving it unable to react to focus out.
		return (
			<div className={ classnames( 'editor-block-mover', { 'is-visible': isFocused || ! isHidden } ) }>
				<IconButton
					className="editor-block-mover__control"
					onClick={ isFirst ? null : onMoveUp }
					icon={ upArrow }
					label={ __( 'Move up' ) }
					aria-describedby={ `editor-block-mover__up-description-${ instanceId }` }
					aria-disabled={ isFirst }
					onFocus={ this.onFocus }
					onBlur={ this.onBlur }
				/>
				<IconButton
					className="editor-block-mover__control"
					onClick={ isLast ? null : onMoveDown }
					icon={ downArrow }
					label={ __( 'Move down' ) }
					aria-describedby={ `editor-block-mover__down-description-${ instanceId }` }
					aria-disabled={ isLast }
					onFocus={ this.onFocus }
					onBlur={ this.onBlur }
				/>
				<span id={ `editor-block-mover__up-description-${ instanceId }` } className="editor-block-mover__description">
					{
						getBlockMoverDescription(
							uids.length,
							blockType && blockType.title,
							firstIndex,
							isFirst,
							isLast,
							-1,
						)
					}
				</span>
				<span id={ `editor-block-mover__down-description-${ instanceId }` } className="editor-block-mover__description">
					{
						getBlockMoverDescription(
							uids.length,
							blockType && blockType.title,
							firstIndex,
							isFirst,
							isLast,
							1,
						)
					}
				</span>
			</div>
		);
	}
}

export default compose(
	withSelect( ( select, { uids, rootUID } ) => {
		const { getBlock, getBlockIndex } = select( 'core/editor' );
		const block = getBlock( first( uids ) );

		return {
			firstIndex: getBlockIndex( first( uids ), rootUID ),
			blockType: block ? getBlockType( block.name ) : null,
		};
	} ),
	withDispatch( ( dispatch, { uids, rootUID } ) => {
		const { moveBlocksDown, moveBlocksUp } = dispatch( 'core/editor' );
		return {
			onMoveDown: partial( moveBlocksDown, uids, rootUID ),
			onMoveUp: partial( moveBlocksUp, uids, rootUID ),
		};
	} ),
	withContext( 'editor' )( ( settings ) => {
		const { templateLock } = settings;

		return {
			isLocked: templateLock === 'all',
		};
	} ),
	withInstanceId,
)( BlockMover );
