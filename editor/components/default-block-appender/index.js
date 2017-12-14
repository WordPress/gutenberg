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

/**
 * Internal dependencies
 */
import './style.scss';
import BlockDropZone from '../block-drop-zone';
import { appendDefaultBlock } from '../../actions';
import { getBlockCount } from '../../selectors';

export class DefaultBlockAppender extends Component {
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
					onFocus={ this.props.appendDefaultBlock }
					onClick={ this.props.appendDefaultBlock }
					onKeyDown={ this.props.appendDefaultBlock }
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
	{ appendDefaultBlock }
)( DefaultBlockAppender );
