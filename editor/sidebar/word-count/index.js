/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';
import { PanelHeader } from 'components';


class WordCount extends Component {

	componentDidMount() {
		console.log( window.wp.utils.WordCounter );
	}

	render() {
		return (
			<PanelHeader label={ __( 'Word Count' ) } >
				<div>{ this.props.wordcount }</div>
			</PanelHeader>
		);
	}
}

export default connect(
	( state ) => {
		return {
			wordcount: 200,
		};
	},
	( dispatch ) => {
		return {
			onUpdateExcerpt( excerpt ) {
				dispatch( editPost( { excerpt } ) );
			},
		};
	}
)( WordCount );
