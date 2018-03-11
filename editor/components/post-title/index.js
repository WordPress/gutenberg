/**
 * External dependencies
 */
import Textarea from 'react-autosize-textarea';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, compose } from '@wordpress/element';
import { keycodes, decodeEntities } from '@wordpress/utils';
import { withSelect, withDispatch } from '@wordpress/data';
import { withContext, withFocusOutside } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import PostPermalink from '../post-permalink';

/**
 * Constants
 */
const REGEXP_NEWLINES = /[\r\n]+/g;
const { ENTER } = keycodes;

class PostTitle extends Component {
	constructor() {
		super( ...arguments );

		this.onChange = this.onChange.bind( this );
		this.onSelect = this.onSelect.bind( this );
		this.onUnselect = this.onUnselect.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );

		this.state = {
			isSelected: false,
		};
	}

	handleFocusOutside() {
		this.onUnselect();
	}

	onSelect() {
		this.setState( { isSelected: true } );
		this.props.clearSelectedBlock();
	}

	onUnselect() {
		this.setState( { isSelected: false } );
	}

	onChange( event ) {
		const newTitle = event.target.value.replace( REGEXP_NEWLINES, ' ' );
		this.props.onUpdate( newTitle );
	}

	onKeyDown( event ) {
		if ( event.keyCode === ENTER ) {
			event.preventDefault();
			this.props.onEnterPress();
		}
	}

	render() {
		const { title, placeholder } = this.props;
		const { isSelected } = this.state;
		const className = classnames( 'editor-post-title', { 'is-selected': isSelected } );

		return (
			<div className={ className }>
				{ isSelected && <PostPermalink /> }
				<Textarea
					className="editor-post-title__input"
					value={ title }
					onChange={ this.onChange }
					placeholder={ decodeEntities( placeholder ) || __( 'Add title' ) }
					aria-label={ decodeEntities( placeholder ) || __( 'Add title' ) }
					onFocus={ this.onSelect }
					onKeyDown={ this.onKeyDown }
					onKeyPress={ this.onUnselect }
				/>
			</div>
		);
	}
}

const applyWithSelect = withSelect( ( select ) => {
	const { getEditedPostAttribute } = select( 'core/editor' );

	return {
		title: getEditedPostAttribute( 'title' ),
	};
} );

const applyWithDispatch = withDispatch( ( dispatch ) => {
	const { insertDefaultBlock, editPost, clearSelectedBlock } = dispatch( 'core/editor' );

	return {
		onEnterPress() {
			insertDefaultBlock( undefined, undefined, 0 );
		},
		onUpdate( title ) {
			editPost( { title } );
		},
		clearSelectedBlock,
	};
} );

const applyEditorSettings = withContext( 'editor' )(
	( settings ) => ( {
		placeholder: settings.titlePlaceholder,
	} )
);

export default compose(
	applyWithSelect,
	applyWithDispatch,
	applyEditorSettings,
	withFocusOutside
)( PostTitle );
