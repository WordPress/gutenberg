/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { getBlock } from 'wp-blocks';
import { size, map, castArray } from 'lodash';
import { ArrowDownAlt2Icon, ArrowUpAlt2Icon } from 'dashicons';
import classNames from 'classnames';
import isEqualShallow from 'is-equal-shallow';

export default class BlockListBlock extends Component {
	maybeFocusOut = ( event ) => {
		if ( ! this.node ) {
			return;
		}

		if ( ! this.node.contains( event.relatedTarget ) ) {
			this.props.onBlur( event );
		}
	};

	setRef = ( node ) => {
		this.node = node;
	};

	bindForm = ( form ) => {
		this.form = form;
	}

	focus = ( position ) => {
		this.form.focus( position );
	};

	render() {
		const { node } = this.props;
		const block = getBlock( node.blockType );
		if ( ! block ) {
			return null;
		}

		const Form = block.form;
		if ( ! Form ) {
			return null;
		}

		const { isFocused } = this.props;
		const classes = classNames( 'block-list__block', {
			'is-focused': isFocused
		} );

		const { executeCommands, tabIndex, onFocus } = this.props;
		const state = {
			setChildren( children ) {
				return {
					type: 'change',
					changes: { children }
				};
			},
			setAttributes( attributes ) {
				if ( isEqualShallow( attributes, node.attrs ) ) {
					return;
				}

				return {
					type: 'change',
					changes: {
						attrs: {
							...node.attrs,
							...attributes
						}
					}
				};
			},
			appendBlock( newBlock ) {
				return {
					type: 'append',
					block: newBlock
				};
			},
			executeCommands: commands => executeCommands( castArray( commands ) )
		};

		return (
			<div
				ref={ this.setRef }
				tabIndex={ tabIndex }
				onFocus={ onFocus }
				onBlur={ this.maybeFocusOut }
				className={ classes }>
				<Form ref={ this.bindForm } block={ node } { ...state } />
				{ isFocused && size( block.controls ) > 0 && (
					<div className="block-list__block-controls">
						{ map( block.controls, ( control, index ) => {
							const controlClasses = classNames( 'block-list__block-control', {
								'is-selected': control.isSelected( node )
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
