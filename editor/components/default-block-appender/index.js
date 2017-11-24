/**
 * External dependencies
 */
import { connect } from 'react-redux';
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

		const className = classnames( 'editor-default-block-appender', {
			'is-visible-placeholder': count === 0,
		} );

		return (
			<div className={ className }>
				<BlockDropZone />
				{ count === 0 &&
					<input
						className="editor-default-block-appender__content"
						type="text"
						readOnly
						onFocus={ this.appendDefaultBlock }
						onClick={ this.appendDefaultBlock }
						onKeyDown={ this.appendDefaultBlock }
						value={ __( 'Write your story' ) }
					/>
				}
				{ count !== 0 &&
					<button
						className="editor-default-block-appender__content"
						onClick={ this.appendDefaultBlock }
					/>
				}
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
