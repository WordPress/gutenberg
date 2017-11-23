/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { noop } from 'lodash';
import classnames from 'classnames';
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
		const { count } = this.props;
		const className = classnames( 'editor-default-block-appender', {
			'is-visible-placeholder': count === 0,
		} );

		return (
			<div className={ className }>
				<BlockDropZone />
				<input
					type="text"
					readOnly
					onFocus={ this.appendDefaultBlock }
					onClick={ noop }
					onKeyDown={ noop }
					value={ count === 0 ? __( 'Write your story' ) : '' }
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
