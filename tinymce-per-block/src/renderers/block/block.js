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
				tabIndex={ tabIndex }
				onFocus={ onFocus }
				className={ classes }
			>
				<Form
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
