/**
 * External dependencies
 */
import { TextInput, Platform } from 'react-native';
import RCTAztecView from 'react-native-aztec';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withInstanceId, compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { withBlockEditContext } from '../block-edit/context';
import {
	create,
	split,
	insert,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export default class PlainText extends Component {
	constructor() {
		super( ...arguments );

		this.onContentSizeChange = this.onContentSizeChange.bind( this );
		this.onChange = this.onChange.bind( this );
		this.onSelectionChangeFromAztec = this.onSelectionChangeFromAztec.bind( this );
		this.onPaste = this.onPaste.bind( this );
		this.insertPastedText = this.insertPastedText.bind( this );

		this.selection = {
			start: 0,
			end:0,
		}

		this.state = {
			height: 0,
		};
	}

	componentDidMount() {
		if ( ( this._input.isFocused() === false ) && ( this.props.isSelected === true ) ) {
			this.focus();
		}
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.isSelected === prevProps.isSelected ) {
			return;
		}

		if ( this.props.isSelected ) {
			this.focus();
		} else {
			this.blur();
		}
	}

	focus() {
		this._input.focus();
	}

	blur() {
		this._input.blur();
	}

	onChange( event ) {
		const value = event.nativeEvent.plainText;
		this.props.onChange( value );
	}

	onPaste( { nativeEvent } ) {
		const finalRecord = this.insertPastedText( nativeEvent.pastedText );
		this.setSelection( finalRecord.start, finalRecord.end );
		this.props.onChange( finalRecord.text );
	}

	insertPastedText( pastedText ) {
		const { value, multiline } = this.props;
		const finalPastedText = multiline ? pastedText : this.removeNewLines( pastedText );
		const currentRecord = create( { text: value } );
		return insert( currentRecord, finalPastedText, this.selection.start, this.selection.end );
	}

	removeNewLines( text ) {
		return text.trim().replace(/(\r\n|\n|\r)/gm, " ");
	}

	onContentSizeChange( contentSize ) {
		const height = contentSize.height;
		this.setState( { height } );
	}

	onSelectionChangeFromAztec( start, end ) {
		const realStart = Math.min( start, end );
		const realEnd = Math.max( start, end );

		if ( this.start !== realStart || this.end !== realEnd ) {
			this.setSelection( realStart, realEnd );
		}
	}

	setSelection( start, end ) {
		this.selection = {
			start, 
			end,
		}
	}

	render() {
		let minHeight = styles[ 'block-editor-plain-text' ].minHeight;

		return (
			<RCTAztecView
				{ ...this.props }
				ref={ ( ref ) => {
					this._input = ref;
				} }
				className={ [ styles[ 'block-editor-plain-text' ], this.props.className ] }
				onFocus={ this.props.onFocus }
				onBlur={ this.props.onBlur }
				fontFamily={ this.props.fontFamily || ( styles[ 'block-editor-plain-text' ].fontFamily ) }
				style={ {
					minHeight: this.state.height,
				} }
				plainText={ {
					text: this.props.value,
					selection: this.selection,
				} }
				onChange={ this.onChange }
				onPaste={ this.onPaste }
				onContentSizeChange={ this.onContentSizeChange }
				onSelectionChange={ this.onSelectionChangeFromAztec }
				maxImagesWidth={ 200 }
				isMultiline={ this.props.multiline }
			/>
		);
	}
}
