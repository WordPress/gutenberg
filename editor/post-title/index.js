/**
 * External dependencies
 */
import { connect } from 'react-redux';
import Textarea from 'react-autosize-textarea';
import clickOutside from 'react-click-outside';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { ENTER } from 'utils/keycodes';

/**
 * Internal dependencies
 */
import './style.scss';
import { getEditedPostTitle } from '../selectors';
import { editPost } from '../actions';
import PostPermalink from '../post-permalink';

/**
 * Constants
 */
const REGEXP_NEWLINES = /[\r\n]+/g;

class PostTitle extends Component {
	constructor() {
		super( ...arguments );
		this.onChange = this.onChange.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.state = {
			isSelected: false,
		};
	}

	onChange( event ) {
		const newTitle = event.target.value.replace( REGEXP_NEWLINES, ' ' );
		this.props.onUpdate( newTitle );
	}

	onFocus() {
		this.setState( { isSelected: true } );
	}

	handleClickOutside() {
		this.setState( { isSelected: false } );
	}

	onKeyDown( event ) {
		if ( event.keyCode === ENTER ) {
			event.preventDefault();
		}
	}

	render() {
		const { title } = this.props;
		const { isSelected } = this.state;
		const className = classnames( 'editor-post-title', { 'is-selected': isSelected } );

		return (
			<div
				className={ className }
				onFocus={ this.onFocus }
			>
				{ isSelected && <PostPermalink /> }
				<h1>
					<Textarea
						className="editor-post-title__input"
						value={ title }
						onChange={ this.onChange }
						placeholder={ wp.i18n.__( 'Enter title here' ) }
						onKeyDown={ this.onKeyDown }
					/>
				</h1>
			</div>
		);
	}
}

export default connect(
	( state ) => ( {
		title: getEditedPostTitle( state ),
	} ),
	( dispatch ) => {
		return {
			onUpdate( title ) {
				dispatch( editPost( { title } ) );
			},
		};
	}
)( clickOutside( PostTitle ) );
