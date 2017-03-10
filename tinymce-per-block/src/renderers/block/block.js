/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import classNames from 'classnames';
import { getBlock } from 'wp-blocks';

/**
 * Internal dependencies
 */
import * as commands from './commands';

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
		const { block, isSelected, focusConfig, first, last } = this.props;
		const blockDefinition = getBlock( block.blockType );
		if ( ! blockDefinition ) {
			return null;
		}

		const Form = blockDefinition.form;
		if ( ! Form ) {
			return null;
		}

		const classes = classNames( 'block-list__block', {
			'is-selected': isSelected
		} );

		const { executeCommand, tabIndex, onFocus } = this.props;
		const api = Object.keys( commands ).reduce( ( memo, command ) => {
			memo[ command ] = ( ...args ) => executeCommand( commands[ command ]( ...args ) );
			return memo;
		}, {} );

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
					api={ api }
					isSelected={ isSelected }
					focusConfig={ focusConfig }
					first={ first }
					last={ last }
				/>
			</div>
		);
	}
}
