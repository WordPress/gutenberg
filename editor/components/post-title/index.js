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
import { KeyboardShortcuts, withContext, withInstanceId, withFocusOutside } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import PostPermalink from '../post-permalink';
import PostTypeSupportCheck from '../post-type-support-check';

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
		this.redirectHistory = this.redirectHistory.bind( this );

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

	/**
	 * Emulates behavior of an undo or redo on its corresponding key press
	 * combination. This is a workaround to React's treatment of undo in a
	 * controlled textarea where characters are updated one at a time.
	 * Instead, leverage the store's undo handling of title changes.
	 *
	 * @see https://github.com/facebook/react/issues/8514
	 *
	 * @param {KeyboardEvent} event Key event.
	 */
	redirectHistory( event ) {
		if ( event.shiftKey ) {
			this.props.onRedo();
		} else {
			this.props.onUndo();
		}

		event.preventDefault();
	}

	render() {
		const { title, placeholder, instanceId } = this.props;
		const { isSelected } = this.state;
		const className = classnames( 'editor-post-title', { 'is-selected': isSelected } );
		const decodedPlaceholder = decodeEntities( placeholder );

		return (
			<PostTypeSupportCheck supportKeys="title">
				<div className={ className }>
					<KeyboardShortcuts
						shortcuts={ {
							'mod+z': this.redirectHistory,
							'mod+shift+z': this.redirectHistory,
						} }
					>
						<label htmlFor={ `post-title-${ instanceId }` } className="screen-reader-text">
							{ decodedPlaceholder || __( 'Add title' ) }
						</label>
						<Textarea
							id={ `post-title-${ instanceId }` }
							className="editor-post-title__input"
							value={ title }
							onChange={ this.onChange }
							placeholder={ decodedPlaceholder || __( 'Add title' ) }
							onFocus={ this.onSelect }
							onKeyDown={ this.onKeyDown }
							onKeyPress={ this.onUnselect }
						/>
					</KeyboardShortcuts>
					{ isSelected && <PostPermalink /> }
				</div>
			</PostTypeSupportCheck>
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
	const {
		insertDefaultBlock,
		editPost,
		clearSelectedBlock,
		undo,
		redo,
	} = dispatch( 'core/editor' );

	return {
		onEnterPress() {
			insertDefaultBlock( undefined, undefined, 0 );
		},
		onUpdate( title ) {
			editPost( { title } );
		},
		onUndo: undo,
		onRedo: redo,
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
	withInstanceId,
	withFocusOutside
)( PostTitle );
