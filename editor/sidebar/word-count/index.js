/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { PanelHeader } from 'components';
import { Component } from 'element';
import { getBlocks, getBlockCount } from '../../selectors';
import { serialize } from '../../../blocks/api';

class WordCount extends Component {
	render() {
		console.log( wp.blocks.getBlockTypes() );
		return (
			<PanelHeader label={ __( 'Word Count' ) } >
				<div>{ this.props.blocks.length }</div>
			</PanelHeader>
		);
	}
}

export default connect(
	( state ) => {
		return {
			blocks: getBlocks( state ),
			blockCount: getBlockCount( state ),
			//content: serialize( getBlocks( state ) ),
		};
	},
)( WordCount );
