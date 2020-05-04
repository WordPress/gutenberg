/**
 * External dependencies
 */
import Textarea from 'react-autosize-textarea';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { ENTER } from '@wordpress/keycodes';
import { withSelect, withDispatch } from '@wordpress/data';
import { VisuallyHidden } from '@wordpress/components';
import { withInstanceId, compose } from '@wordpress/compose';
import { pasteHandler } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';

/**
 * Constants
 */
const REGEXP_NEWLINES = /[\r\n]+/g;

class PostTitle extends Component {
	constructor() {
		super( ...arguments );

		this.onChange = this.onChange.bind( this );
		this.onSelect = this.onSelect.bind( this );
		this.onUnselect = this.onUnselect.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onPaste = this.onPaste.bind( this );

		this.state = {
			isSelected: false,
		};
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

	onPaste( event ) {
		const { title, onInsertBlockAfter, onUpdate } = this.props;
		const clipboardData = event.clipboardData;

		let plainText = '';
		let html = '';

		// IE11 only supports `Text` as an argument for `getData` and will
		// otherwise throw an invalid argument error, so we try the standard
		// arguments first, then fallback to `Text` if they fail.
		try {
			plainText = clipboardData.getData( 'text/plain' );
			html = clipboardData.getData( 'text/html' );
		} catch ( error1 ) {
			try {
				html = clipboardData.getData( 'Text' );
			} catch ( error2 ) {
				// Some browsers like UC Browser paste plain text by default and
				// don't support clipboardData at all, so allow default
				// behaviour.
				return;
			}
		}

		// Allows us to ask for this information when we get a report.
		window.console.log( 'Received HTML:\n\n', html );
		window.console.log( 'Received plain text:\n\n', plainText );

		const content = pasteHandler( {
			HTML: html,
			plainText,
		} );

		if ( typeof content !== 'string' && content.length ) {
			event.preventDefault();

			const [ firstBlock ] = content;

			if (
				! title &&
				( firstBlock.name === 'core/heading' ||
					firstBlock.name === 'core/paragraph' )
			) {
				onUpdate( firstBlock.attributes.content );
				onInsertBlockAfter( content.slice( 1 ) );
			} else {
				onInsertBlockAfter( content );
			}
		}
	}

	render() {
		const {
			hasFixedToolbar,
			isCleanNewPost,
			isFocusMode,
			instanceId,
			placeholder,
			title,
		} = this.props;
		const { isSelected } = this.state;

		// The wp-block className is important for editor styles.
		// This same block is used in both the visual and the code editor.
		const className = classnames(
			'wp-block editor-post-title editor-post-title__block',
			{
				'is-selected': isSelected,
				'is-focus-mode': isFocusMode,
				'has-fixed-toolbar': hasFixedToolbar,
			}
		);
		const decodedPlaceholder = decodeEntities( placeholder );

		return (
			<PostTypeSupportCheck supportKeys="title">
				<div className={ className }>
					<VisuallyHidden
						as="label"
						htmlFor={ `post-title-${ instanceId }` }
					>
						{ decodedPlaceholder || __( 'Add title' ) }
					</VisuallyHidden>
					<Textarea
						id={ `post-title-${ instanceId }` }
						className="editor-post-title__input"
						value={ title }
						onChange={ this.onChange }
						placeholder={ decodedPlaceholder || __( 'Add title' ) }
						onFocus={ this.onSelect }
						onBlur={ this.onUnselect }
						onKeyDown={ this.onKeyDown }
						onKeyPress={ this.onUnselect }
						onPaste={ this.onPaste }
						/*
							Only autofocus the title when the post is entirely empty.
							This should only happen for a new post, which means we
							focus the title on new post so the author can start typing
							right away, without needing to click anything.
						*/
						/* eslint-disable jsx-a11y/no-autofocus */
						autoFocus={
							( document.body === document.activeElement ||
								! document.activeElement ) &&
							isCleanNewPost
						}
						/* eslint-enable jsx-a11y/no-autofocus */
					/>
				</div>
			</PostTypeSupportCheck>
		);
	}
}

const applyWithSelect = withSelect( ( select ) => {
	const { getEditedPostAttribute, isCleanNewPost } = select( 'core/editor' );
	const { getSettings } = select( 'core/block-editor' );
	const { titlePlaceholder, focusMode, hasFixedToolbar } = getSettings();

	return {
		isCleanNewPost: isCleanNewPost(),
		title: getEditedPostAttribute( 'title' ),
		placeholder: titlePlaceholder,
		isFocusMode: focusMode,
		hasFixedToolbar,
	};
} );

const applyWithDispatch = withDispatch( ( dispatch ) => {
	const { insertDefaultBlock, clearSelectedBlock, insertBlocks } = dispatch(
		'core/block-editor'
	);
	const { editPost } = dispatch( 'core/editor' );

	return {
		onEnterPress() {
			insertDefaultBlock( undefined, undefined, 0 );
		},
		onInsertBlockAfter( blocks ) {
			insertBlocks( blocks, 0 );
		},
		onUpdate( title ) {
			editPost( { title } );
		},
		clearSelectedBlock,
	};
} );

export default compose(
	applyWithSelect,
	applyWithDispatch,
	withInstanceId
)( PostTitle );
