/**
 * External dependencies
 */
import { pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { getInlineBlocks } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InserterGroup from './group';

export default class InserterInlineMenu extends Component {
	render() {
		const inlineBlocks = getInlineBlocks();
		const items = inlineBlocks.map( ( inlineBlock ) => (
			pick( inlineBlock, [ 'id', 'title', 'icon' ] )
		) );

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
					items={ items }
					onSelectItem={ this.props.onSelect }
				/>
			</Fragment>
		);
	}
}
