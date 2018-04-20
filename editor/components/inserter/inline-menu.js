/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { NavigableMenu } from '@wordpress/components';
import { BlockIcon } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

export default class InserterInlineMenu extends Component {
	render() {
		return (
			<NavigableMenu>
				<div
					className="editor-inserter__separator"
					id="editor-inserter__separator-inline"
					aria-hidden="true"
				>
					{ __( 'Inline Blocks' ) }
				</div>
				<button
					className="editor-inserter__block"
					onClick={ this.props.onImageSelect }
				>
					<BlockIcon icon="format-image" />
					{ __( 'Inline Image' ) }
				</button>
			</NavigableMenu>
		);
	}
}
