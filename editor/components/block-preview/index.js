/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { createBlock, BlockEdit } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { createInnerBlockList } from '../../utils/block-list';
import './style.scss';

/**
 * Block Preview Component: It renders a preview given a block name and attributes.
 *
 * @param   {Object}    props Component props.
 * @return {WPElement}       Rendered element.
 */
class BlockPreview extends Component {
	getChildContext() {
		// Blocks may render their own BlockEdit, in which case we must provide
		// a mechanism for them to create their own InnerBlockList. BlockEdit
		// is defined in `@wordpress/blocks`, so to avoid a circular dependency
		// we inject this function via context.
		return {
			createInnerBlockList: ( uid ) => {
				return createInnerBlockList( uid, noop, noop );
			},
		};
	}

	render() {
		const { name, attributes } = this.props;

		const block = createBlock( name, attributes );

		return (
			<div className="editor-block-preview">
				<div className="editor-block-preview__title">Preview</div>
				<div className="editor-block-preview__content">
					<BlockEdit
						name={ name }
						focus={ false }
						attributes={ block.attributes }
						setAttributes={ noop }
					/>
				</div>
			</div>
		);
	}
}

BlockPreview.childContextTypes = {
	createInnerBlockList: noop,
};

export default BlockPreview;
