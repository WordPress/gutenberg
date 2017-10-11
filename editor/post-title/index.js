/**
 * External dependencies
 */
import { connect } from 'react-redux';
import Textarea from 'react-autosize-textarea';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, findDOMNode } from '@wordpress/element';
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
		this.onOuterBlur = this.onOuterBlur.bind( this );
		this.onOuterFocus = this.onOuterFocus.bind( this );
		this.setFocused = this.setFocused.bind( this );
		this.focusText = this.focusText.bind( this );

		this.state = {
			isSelected: false,
			hasFocusWithin: false,
		};
		this.blurTimer = null;
	}

	componentDidMount() {
		document.addEventListener( 'selectionchange', this.onSelectionChange );
		// eslint-disable-next-line react/no-find-dom-node
		this.setFocused( findDOMNode( this ).contains( document.activeElement ) );
	}

	componentWillUnmount() {
		document.removeEventListener( 'selectionchange', this.onSelectionChange );
		clearTimeout( this.blurTimer );
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

	focusText() {
		this.textareaContainer.textarea.focus();
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

	setFocused( focused ) {
		this.setState( { hasFocusWithin: focused } );
		if ( focused ) {
			this.props.clearSelectedBlock();
		}
	}

	onOuterFocus() {
		clearTimeout( this.blurTimer );
		this.setFocused( true );
	}

	onOuterBlur( e ) {
		const target = e.currentTarget;
		clearTimeout( this.blurTimer );
		this.blurTimer = setTimeout( () => {
			this.setFocused( target.contains( document.activeElement ) );
		}, 0 );
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
		const { isSelected, hasFocusWithin } = this.state;
		const className = classnames( 'editor-post-title', { 'is-selected': isSelected && hasFocusWithin } );

		return (
			<div
				className={ className }
				onBlur={ this.onOuterBlur }
				onFocus={ this.onOuterFocus }>
				{ isSelected && hasFocusWithin && <PostPermalink onLinkCopied={ this.focusText } /> }
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
)( PostTitle );
