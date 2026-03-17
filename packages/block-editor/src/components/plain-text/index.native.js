/**
 * External dependencies
 */
import { TextInput, Platform, Dimensions } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { getPxFromCssUnit } from '@wordpress/components';

/**
 * Internal dependencies
 */
import RichText from '../rich-text';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export default class PlainText extends Component {
	constructor() {
		super( ...arguments );
		this.isAndroid = Platform.OS === 'android';

		this.onChangeTextInput = this.onChangeTextInput.bind( this );
		this.onChangeRichText = this.onChangeRichText.bind( this );
	}

	componentDidMount() {
		// If isSelected is true, we should request the focus on this TextInput.
		if (
			this._input &&
			this._input.isFocused() === false &&
			this.props.isSelected
		) {
			if ( this.isAndroid ) {
				/*
				 * There seems to be an issue in React Native where the keyboard doesn't show if called shortly after rendering.
				 * As a common work around this delay is used.
				 * https://github.com/facebook/react-native/issues/19366#issuecomment-400603928
				 */
				this.timeoutID = setTimeout( () => {
					this._input.focus();
				}, 100 );
			} else {
				this._input.focus();
			}
		}
	}

	componentDidUpdate( prevProps ) {
		if ( ! this.props.isSelected && prevProps.isSelected ) {
			this._input?.blur();
		}
	}

	componentWillUnmount() {
		if ( this.isAndroid ) {
			clearTimeout( this.timeoutID );
		}
	}

	focus() {
		this._input?.focus();
	}

	blur() {
		this._input?.blur();
	}

	getFontSize() {
		const { style } = this.props;

		if ( ! style?.fontSize ) {
			return;
		}

		const { width, height } = Dimensions.get( 'window' );
		const cssUnitOptions = { height, width };

		return {
			fontSize: parseFloat(
				getPxFromCssUnit( style.fontSize, cssUnitOptions )
			),
		};
	}

	replaceLineBreakTags( value ) {
		return value?.replace( RegExp( '<br>', 'gim' ), '\n' );
	}

	onChangeTextInput( event ) {
		const { onChange } = this.props;
		onChange( event.nativeEvent.text );
	}

	onChangeRichText( value ) {
		const { onChange } = this.props;
		// The <br> tags have to be replaced with new line characters
		// as the content of plain text shouldn't contain HTML tags.
		onChange( this.replaceLineBreakTags( value ) );
	}

	render() {
		const { style, __experimentalVersion, onFocus, ...otherProps } =
			this.props;
		const textStyles = [
			style || styles[ 'block-editor-plain-text' ],
			this.getFontSize(),
		];

		if ( __experimentalVersion === 2 ) {
			const disableFormattingProps = {
				withoutInteractiveFormatting: true,
				disableEditingMenu: true,
				__unstableDisableFormats: true,
				disableSuggestions: true,
			};

			const forcePlainTextProps = {
				preserveWhiteSpace: true,
				__unstablePastePlainText: true,
				multiline: false,
			};

			const fontProps = {
				fontFamily: style?.fontFamily,
				fontSize: style?.fontSize,
				fontWeight: style?.fontWeight,
			};

			return (
				<RichText
					{ ...otherProps }
					{ ...disableFormattingProps }
					{ ...forcePlainTextProps }
					{ ...fontProps }
					identifier="content"
					style={ style }
					onChange={ this.onChangeRichText }
					unstableOnFocus={ onFocus }
				/>
			);
		}

		return (
			<TextInput
				{ ...this.props }
				ref={ ( x ) => ( this._input = x ) }
				onChange={ this.onChangeTextInput }
				onFocus={ this.props.onFocus } // Always assign onFocus as a props.
				onBlur={ this.props.onBlur } // Always assign onBlur as a props.
				fontFamily={
					( this.props.style && this.props.style.fontFamily ) ||
					styles[ 'block-editor-plain-text' ].fontFamily
				}
				style={ textStyles }
				scrollEnabled={ false }
			/>
		);
	}
}
