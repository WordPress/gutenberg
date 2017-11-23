/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { noop } from 'lodash';
import 'element-closest';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { getDefaultBlockName, createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockDropZone from '../block-drop-zone';
import { insertBlock } from '../../actions';

class DefaultBlockAppender extends Component {
	constructor( props ) {
		super( props );
		this.appendDefaultBlock = this.appendDefaultBlock.bind( this );
	}

	appendDefaultBlock() {
		const newBlock = createBlock( getDefaultBlockName() );
		this.props.onInsertBlock( newBlock );
	}

	render() {
		return (
			<div className="editor-default-block-appender">
				<BlockDropZone />
				<input
					type="text"
					readOnly
					onFocus={ this.appendDefaultBlock }
					onClick={ noop }
					onKeyDown={ noop }
				/>
			</div>
		);
	}
}

export default connect(
	undefined,
	{ onInsertBlock: insertBlock }
)( DefaultBlockAppender );
