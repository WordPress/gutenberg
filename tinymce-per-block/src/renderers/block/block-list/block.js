/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { getBlock } from 'wp-blocks';
import { size, map } from 'lodash';
import { ArrowDownAlt2Icon, ArrowUpAlt2Icon } from 'dashicons';
import classNames from 'classnames';
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
		this.form.focus( position );
	};

	merge = ( block, index ) => {
		this.form.merge && this.form.merge( block, index );
	}

	render() {
		const { block } = this.props;
		const blockDefinition = getBlock( block.blockType );
		if ( ! blockDefinition ) {
			return null;
		}

		const Form = blockDefinition.form;
		if ( ! Form ) {
			return null;
		}

		const { isFocused } = this.props;
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
				className={ classes }>
				<Form ref={ this.bindForm } block={ block } { ...state } />
				{ isFocused && size( blockDefinition.controls ) > 0 && (
					<div className="block-list__block-controls">
						{ map( blockDefinition.controls, ( control, index ) => {
							const controlClasses = classNames( 'block-list__block-control', {
								'is-selected': control.isSelected( block )
							} );

							return (
								<button
									key={ index }
									onClick={ () => control.onClick( state ) }
									className={ controlClasses }>
									<control.icon />
								</button>
							);
						} ) }
					</div>
				) }
				{ isFocused && (
					<div className="block-list__block-arrangement">
						<div className="block-list__movement-controls">
							<button className="block-list__block-arrange-control">
								<ArrowUpAlt2Icon />
							</button>
							<button className="block-list__block-arrange-control">
								<ArrowDownAlt2Icon />
							</button>
						</div>
						{ block.icon && (
							<div className="block-list__type-controls">
								<button className="block-list__block-arrange-control">
									<block.icon />
								</button>
							</div>
						) }
					</div>
				) }
			</div>
		);
	}
}
