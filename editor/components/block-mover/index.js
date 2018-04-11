/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { first } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, withContext, withInstanceId } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';
import { compose, Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { getBlockMoverDescription } from './mover-description';
import { getBlockIndex, getBlock } from '../../store/selectors';
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

/**
 * Action creator creator which, given the action type to dispatch and the
 * arguments of mapDispatchToProps, creates a prop dispatcher callback for
 * managing block movement.
 *
 * @param {string}   type     Action type to dispatch.
 * @param {Function} dispatch Store dispatch.
 * @param {Object}   ownProps The wrapped component's own props.
 *
 * @return {Function} Prop dispatcher callback.
 */
function createOnMove( type, dispatch, ownProps ) {
	return () => {
		const { uids, rootUID } = ownProps;
		dispatch( { type, uids, rootUID } );
	};
}

export default compose(
	connect(
		( state, ownProps ) => {
			const { uids, rootUID } = ownProps;
			const block = getBlock( state, first( uids ) );

			return ( {
				firstIndex: getBlockIndex( state, first( uids ), rootUID ),
				blockType: block ? getBlockType( block.name ) : null,
			} );
		},
		( ...args ) => ( {
			onMoveDown: createOnMove( 'MOVE_BLOCKS_DOWN', ...args ),
			onMoveUp: createOnMove( 'MOVE_BLOCKS_UP', ...args ),
		} )
	),
	withContext( 'editor' )( ( settings ) => {
		const { templateLock } = settings;

		return {
			isLocked: templateLock === 'all',
		};
	} ),
	withInstanceId,
)( BlockMover );
