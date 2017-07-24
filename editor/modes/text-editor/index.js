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
import PostTitle from '../../post-title';
import { getEditedPostContent } from '../../selectors';
import { editPost, resetBlocks } from '../../actions';

class TextEditor extends Component {
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
			<div className="editor-text-editor">
				<header className="editor-text-editor__formatting">
					<div className="editor-text-editor__formatting-group">
						<button className="editor-text-editor__bold">b</button>
						<button className="editor-text-editor__italic">i</button>
						<button className="editor-text-editor__link">link</button>
						<button>b-quote</button>
						<button className="editor-text-editor__del">del</button>
						<button>ins</button>
						<button>img</button>
						<button>ul</button>
						<button>ol</button>
						<button>li</button>
						<button>code</button>
						<button>more</button>
						<button>close tags</button>
					</div>
				</header>
				<div className="editor-text-editor__body">
					<PostTitle />
					<Textarea
						autoComplete="off"
						value={ value }
						onChange={ this.onChange }
						onBlur={ this.onPersist }
						className="editor-text-editor__textarea"
					/>
				</div>
			</div>
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
)( TextEditor );
