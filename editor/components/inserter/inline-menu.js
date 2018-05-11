/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { registerCoreInlineBlocks } from '../../../core-inline-blocks';
import { getInlineBlockTypes } from '../../../inline-blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InserterGroup from './group';

// TODO: move this to lib/client-assets.php
registerCoreInlineBlocks();

export default class InserterInlineMenu extends Component {
	render() {
		const inlineBlocks = getInlineBlockTypes();

		return (
			<Fragment>
				<div
					className="editor-inserter__separator"
					id="editor-inserter__separator-inline"
					aria-hidden="true"
				>
					{ __( 'Inline Blocks' ) }
				</div>
				<InserterGroup
					items={ inlineBlocks }
					onSelectItem={ this.props.onSelect }
				/>
			</Fragment>
		);
	}
}
