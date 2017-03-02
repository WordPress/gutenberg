/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import classNames from 'classnames';
import { getBlock } from 'wp-blocks';
import isEqualShallow from 'is-equal-shallow';

export default class BlockListBlock extends Component {
	maybeFocusOut = ( event ) => {
		if ( ! this.blockNode ) {
			return;
		}

		if ( ! this.blockNode.contains( event.relatedTarget ) ) {
			this.props.onBlur( event );
		}
	};

	setRef = ( blockNode ) => {
		this.blockNode = blockNode;
	};

	bindForm = ( form ) => {
		this.form = form;
	}

	focus = ( position ) => {
		this.form.focus && this.form.focus( position );
	};

	merge = ( block, index ) => {
		this.form.merge && this.form.merge( block, index );
	}

	render() {
		const { block, isFocused } = this.props;
		const blockDefinition = getBlock( block.blockType );
		if ( ! blockDefinition ) {
			return null;
		}

		const Form = blockDefinition.form;
		if ( ! Form ) {
			return null;
		}

		const classes = classNames( 'block-list__block', {
			'is-focused': isFocused
		} );

		const { executeCommand, tabIndex, onFocus } = this.props;
		const state = {
			setChildren( children ) {
				executeCommand( {
					type: 'change',
					changes: { children }
				} );
			},
			setAttributes( attributes ) {
				if ( isEqualShallow( attributes, block.attrs ) ) {
					return;
				}

				executeCommand( {
					type: 'change',
					changes: {
						attrs: {
							...block.attrs,
							...attributes
						}
					}
				} );
			},
			appendBlock( newBlock ) {
				executeCommand( {
					type: 'append',
					block: newBlock
				} );
			},
			remove( index ) {
				executeCommand( {
					type: 'remove',
					index
				} );
			},
			mergeWithPrevious() {
				executeCommand( {
					type: 'mergeWithPrevious'
				} );
			},
			focus( position ) {
				executeCommand( {
					type: 'focus',
					position
				} );
			},
			moveUp() {
				executeCommand( {
					type: 'moveUp'
				} );
			},
			moveDown() {
				executeCommand( {
					type: 'moveDown'
				} );
			}
		};

		return (
			<div
				ref={ this.setRef }
				tabIndex={ tabIndex }
				onFocus={ onFocus }
				onBlur={ this.maybeFocusOut }
				className={ classes }
			>
				<Form ref={ this.bindForm } block={ block } { ...state } isFocused={ isFocused } />
			</div>
		);
	}
}
