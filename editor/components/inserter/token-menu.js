/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { NavigableMenu } from '@wordpress/components';
import { BlockIcon } from '@wordpress/blocks';

export default class InserterTokenMenu extends Component {
	render() {
		return (
			<NavigableMenu>
				<div
					className="editor-inserter__separator"
					id="editor-inserter__separator-inline"
					aria-hidden="true"
				>
					Inline Blocks
				</div>
				<button
					className="editor-inserter__block"
					onClick={ this.props.onImageSelect }
				>
					<BlockIcon icon="format-image" />
					Inline Image
				</button>
			</NavigableMenu>
		);
	}
}
