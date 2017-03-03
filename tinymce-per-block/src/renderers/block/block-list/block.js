/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import classNames from 'classnames';
import { getBlock } from 'wp-blocks';

export default class BlockListBlock extends Component {
	setRef = ( blockNode ) => {
		this.blockNode = blockNode;
	};

	bindForm = ( form ) => {
		this.form = form;
	}

	merge = ( block, index ) => {
		this.form.merge && this.form.merge( block, index );
	}

	render() {
		const { block, isFocused, focusConfig } = this.props;
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
			change( changes ) {
				executeCommand( {
					type: 'change',
					changes
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
			focus( config ) {
				executeCommand( {
					type: 'focus',
					config
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
				className={ classes }
			>
				<Form
					ref={ this.bindForm }
					block={ block }
					{ ...state }
					isFocused={ isFocused }
					focusConfig={ focusConfig }
				/>
			</div>
		);
	}
}
