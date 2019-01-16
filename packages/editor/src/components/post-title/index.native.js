/**
 * External dependencies
 */
import { TextInput } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { withSelect, withDispatch } from '@wordpress/data';
import { withFocusOutside } from '@wordpress/components';
import { withInstanceId, compose } from '@wordpress/compose';

class PostTitle extends Component {
	constructor() {
		super( ...arguments );

		this.onChange = this.onChange.bind( this );
		this.onSelect = this.onSelect.bind( this );
		this.onUnselect = this.onUnselect.bind( this );

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
				onFocus={ this.onSelect }
				placeholder={ decodedPlaceholder }
				style={ style }
				value={ title }>
			</TextInput>
		);
	}
}

const applyWithDispatch = withDispatch( ( dispatch ) => {
	const {
		clearSelectedBlock,
	} = dispatch( 'core/editor' );

	return {
		clearSelectedBlock,
	};
} );

export default compose(
	applyWithDispatch,
	withInstanceId,
	withFocusOutside
)( PostTitle );
