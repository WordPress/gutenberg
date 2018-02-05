/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { last } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { getDefaultBlockName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockDropZone from '../block-drop-zone';
import { appendDefaultBlock } from '../../store/actions';
import { getBlockCount, getBlocks } from '../../store/selectors';

export class DefaultBlockAppender extends Component {
	render() {
		const { count, blocks } = this.props;
		const lastBlock = last( blocks );
		const showAppender = lastBlock && lastBlock.name !== getDefaultBlockName();

		return (
			<div className="editor-default-block-appender">
				{ ( count === 0 || showAppender ) && <BlockDropZone /> }
				{ count === 0 &&
					<input
						className="editor-default-block-appender__content"
						type="text"
						readOnly
						onFocus={ this.props.appendDefaultBlock }
						onClick={ this.props.appendDefaultBlock }
						onKeyDown={ this.props.appendDefaultBlock }
						value={ __( 'Write your story' ) }
					/>
				}
				{ count !== 0 && showAppender &&
					<input
						className="editor-default-block-appender__content"
						type="text"
						readOnly
						onFocus={ this.props.appendDefaultBlock }
						onClick={ this.props.appendDefaultBlock }
						onKeyDown={ this.props.appendDefaultBlock }
						value=""
					/>
				}
			</div>
		);
	}
}

export default connect(
	( state ) => ( {
		count: getBlockCount( state ),
		blocks: getBlocks( state ),
	} ),
	{ appendDefaultBlock }
)( DefaultBlockAppender );
