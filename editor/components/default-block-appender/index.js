/**
 * External dependencies
 */
import { connect } from 'react-redux';
import 'element-closest';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { getDefaultBlockName, createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockDropZone from '../block-drop-zone';
import { insertBlock } from '../../actions';
import { getBlockCount } from '../../selectors';

export class DefaultBlockAppender extends Component {
	constructor( props ) {
		super( props );
		this.appendDefaultBlock = this.appendDefaultBlock.bind( this );
	}

	appendDefaultBlock() {
		const newBlock = createBlock( getDefaultBlockName() );
		this.props.onInsertBlock( newBlock );
	}

	render() {
		const { count } = this.props;
		if ( count !== 0 ) {
			return null;
		}

		return (
			<div className="editor-default-block-appender">
				<BlockDropZone />
				<input
					className="editor-default-block-appender__content"
					type="text"
					readOnly
					onFocus={ this.appendDefaultBlock }
					onClick={ this.appendDefaultBlock }
					onKeyDown={ this.appendDefaultBlock }
					value={ __( 'Write your story' ) }
				/>
			</div>
		);
	}
}

export default connect(
	( state ) => ( {
		count: getBlockCount( state ),
	} ),
	{ onInsertBlock: insertBlock }
)( DefaultBlockAppender );
