/**
 * External dependencies
 */
import { connect } from 'react-redux';
import Textarea from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import { getEditedPostContent } from '../../store/selectors';
import { editPost, resetBlocks } from '../../store/actions';

class PostTextEditor extends Component {
	constructor( props ) {
		super( ...arguments );

		this.onChange = this.onChange.bind( this );
		this.onPersist = this.onPersist.bind( this );

		this.state = {
			initialValue: props.value,
		};
	}

	onChange( event ) {
		this.props.onChange( event.target.value );
	}

	onPersist( event ) {
		const { value } = event.target;
		if ( value !== this.state.initialValue ) {
			this.props.onPersist( value );

			this.setState( {
				initialValue: value,
			} );
		}
	}

	render() {
		const { value } = this.props;

		return (
			<Textarea
				autoComplete="off"
				value={ value }
				onChange={ this.onChange }
				onBlur={ this.onPersist }
				className="editor-post-text-editor"
			/>
		);
	}
}

export default connect(
	( state ) => ( {
		value: getEditedPostContent( state ),
	} ),
	{
		onChange( content ) {
			return editPost( { content } );
		},
		onPersist( content ) {
			return resetBlocks( parse( content ) );
		},
	}
)( PostTextEditor );
