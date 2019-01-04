/**
 * External dependencies
 */
import { TextInput } from 'react-native';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { ENTER } from '@wordpress/keycodes';
import { withSelect, withDispatch } from '@wordpress/data';
import { KeyboardShortcuts } from '@wordpress/components';
import { withInstanceId, compose } from '@wordpress/compose';
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
		this.redirectHistory = this.redirectHistory.bind( this );

		console.log( "Arguments: " +  JSON.stringify(arguments) );

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

	onChange( title ) {
		this.props.onUpdate( title );
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
		const {
			hasFixedToolbar,
			isCleanNewPost,
			isFocusMode,
			isPostTypeViewable,
			instanceId,
			placeholder,
			style,
			title,
		} = this.props;
		
		const { isSelected } = this.state;
		const decodedPlaceholder = decodeEntities( placeholder );

		console.log("Placeholder: " + placeholder);
		console.log("Decoded: " + decodedPlaceholder);

		return (
			<TextInput
				blurOnSubmit={ true }
				textAlignVertical="top"
				multiline
				numberOfLines={ 0 }
				onChangeText={ this.onChange }
				placeholder={ decodedPlaceholder }
				style={ style }
				value={ title }>
			</TextInput>
		);
	}
}

export default compose(
	withInstanceId,
)( PostTitle );
