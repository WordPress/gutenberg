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
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import { getEditedPostTitle } from '../selectors';
import { editPost, clearSelectedBlock } from '../actions';
import PostPermalink from '../post-permalink';

/**
 * Constants
 */
const REGEXP_NEWLINES = /[\r\n]+/g;
const { ENTER } = keycodes;

class PostTitle extends Component {
	constructor() {
		super( ...arguments );
		this.bindTextarea = this.bindTextarea.bind( this );
		this.onChange = this.onChange.bind( this );
		this.onSelect = this.onSelect.bind( this );
		this.onUnselect = this.onUnselect.bind( this );
		this.onSelectionChange = this.onSelectionChange.bind( this );
		this.state = {
			isSelected: false,
		};
	}

	componentDidMount() {
		document.addEventListener( 'selectionchange', this.onSelectionChange );
	}

	componentWillUnmount() {
		document.removeEventListener( 'selectionchange', this.onSelectionChange );
	}

	bindTextarea( ref ) {
		this.textareaContainer = ref;
	}

	onSelectionChange() {
		const textarea = this.textareaContainer.textarea;
		if (
			document.activeElement === textarea &&
			textarea.selectionStart !== textarea.selectionEnd
		) {
			this.onSelect();
		}
	}

	onChange( event ) {
		const newTitle = event.target.value.replace( REGEXP_NEWLINES, ' ' );
		this.props.onUpdate( newTitle );
	}

	onSelect() {
		this.setState( { isSelected: true } );
		this.props.clearSelectedBlock();
	}

	onUnselect() {
		this.setState( { isSelected: false } );
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
			<div className={ className }>
				{ isSelected && <PostPermalink /> }
				<h1>
					<Textarea
						ref={ this.bindTextarea }
						className="editor-post-title__input"
						value={ title }
						onChange={ this.onChange }
						placeholder={ __( 'Add title' ) }
						onFocus={ this.onSelect }
						onClick={ this.onSelect }
						onKeyDown={ this.onKeyDown }
						onKeyPress={ this.onUnselect }
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
			clearSelectedBlock() {
				dispatch( clearSelectedBlock() );
			},
		};
	}
)( clickOutside( PostTitle ) );
