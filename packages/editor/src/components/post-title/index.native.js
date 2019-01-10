/**
 * External dependencies
 */
import { TextInput } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { ENTER } from '@wordpress/keycodes';
import { withInstanceId, compose } from '@wordpress/compose';

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
			placeholder,
			style,
			title,
		} = this.props;

		const decodedPlaceholder = decodeEntities( placeholder );

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
