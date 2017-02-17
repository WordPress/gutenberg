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
		if ( ! this.node ) {
			return;
		}

		if ( ! this.node.contains( event.relatedTarget ) ) {
			this.props.onFocusOut( event );
		}
	};

	setRef = ( node ) => {
		this.node = node;
	};

	render() {
		const { node } = this.props;
		const block = getBlock( node.blockType );
		if ( ! block ) {
			return null;
		}

		const form = block.form || block.display;
		if ( ! form ) {
			return null;
		}

		const { isFocused } = this.props;
		const classes = classNames( 'block-list__block', {
			'is-focused': isFocused
		} );

		const { onChange, tabIndex, onFocus } = this.props;
		const state = {
			setChildren( children ) {
				onChange( {
					...node,
					children
				} );
			},
			setAttributes( attributes ) {
				if ( isEqualShallow( attributes, node.attrs ) ) {
					return;
				}

				onChange( {
					...node,
					attrs: {
						...node.attrs,
						...attributes
					}
				} );
			}
		};

		return (
			<div
				ref={ this.setRef }
				tabIndex={ tabIndex }
				onFocus={ onFocus }
				onFocusOut={ this.maybeFocusOut }
				className={ classes }>
				{ form( node, state ) }
				{ isFocused && size( block.controls ) > 0 && (
					<div className="block-list__block-controls">
						{ map( block.controls, ( control ) => {
							const controlClasses = classNames( 'block-list__block-control', {
								'is-selected': control.isSelected( node )
							} );

							return (
								<button
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
