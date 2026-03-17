/**
 * External dependencies
 */
import { ScrollView, TextInput } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { parse } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { addFilter, removeFilter } from '@wordpress/hooks';
import {
	withInstanceId,
	compose,
	withPreferredColorScheme,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import KeyboardAvoidingView from '../keyboard-avoiding-view';
import styles from './style.scss';

export class HTMLTextInput extends Component {
	constructor() {
		super( ...arguments );

		this.edit = this.edit.bind( this );
		this.stopEditing = this.stopEditing.bind( this );
		this.getHTMLForParent = this.getHTMLForParent.bind( this );
		addFilter(
			'native.persist-html',
			'html-text-input',
			this.getHTMLForParent
		);

		this.state = {};
	}

	static getDerivedStateFromProps( props, state ) {
		if ( state.isDirty ) {
			return null;
		}

		return {
			value: props.value,
			isDirty: false,
		};
	}

	componentWillUnmount() {
		removeFilter( 'native.persist-html', 'html-text-input' );
		// TODO: Blocking main thread.
		this.stopEditing();
	}

	edit( html ) {
		this.props.onChange( html );
		this.setState( { value: html, isDirty: true } );
	}

	getHTMLForParent() {
		return this.state.value;
	}

	stopEditing() {
		if ( this.state.isDirty ) {
			this.props.onPersist( this.state.value );
			this.setState( { isDirty: false } );
		}
	}

	render() {
		const {
			editTitle,
			getStylesFromColorScheme,
			parentHeight,
			style,
			title,
		} = this.props;
		const titleStyle = [
			getStylesFromColorScheme(
				styles.htmlViewTitle,
				styles.htmlViewTitleDark
			),
			style?.text && { color: style.text },
		];
		const htmlStyle = [
			getStylesFromColorScheme( styles.htmlView, styles.htmlViewDark ),
			style?.text && { color: style.text },
		];
		const placeholderStyle = {
			...getStylesFromColorScheme(
				styles.placeholder,
				styles.placeholderDark
			),
			...( style?.text && { color: style.text } ),
		};
		return (
			<KeyboardAvoidingView
				style={ styles.keyboardAvoidingView }
				parentHeight={ parentHeight }
			>
				<ScrollView style={ styles.scrollView }>
					<TextInput
						autoCorrect={ false }
						accessibilityLabel="html-view-title"
						textAlignVertical="center"
						numberOfLines={ 1 }
						style={ titleStyle }
						value={ title }
						placeholder={ __( 'Add title' ) }
						placeholderTextColor={ placeholderStyle.color }
						onChangeText={ editTitle }
					/>
					<TextInput
						ref={ this.contentTextInputRef }
						autoCorrect={ false }
						accessibilityLabel="html-view-content"
						textAlignVertical="top"
						multiline
						style={ htmlStyle }
						value={ this.state.value }
						onChangeText={ this.edit }
						onBlur={ this.stopEditing }
						placeholder={ __( 'Start writing…' ) }
						placeholderTextColor={ placeholderStyle.color }
						scrollEnabled={ false }
						// [Only iOS] This prop prevents the text input from
						// automatically getting focused after scrolling
						// content.
						rejectResponderTermination={ false }
					/>
				</ScrollView>
			</KeyboardAvoidingView>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { getEditedPostAttribute, getEditedPostContent } =
			select( 'core/editor' );

		return {
			title: getEditedPostAttribute( 'title' ),
			value: getEditedPostContent(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost, resetEditorBlocks } = dispatch( 'core/editor' );
		return {
			editTitle( title ) {
				editPost( { title } );
			},
			onChange( content ) {
				editPost( { content } );
			},
			onPersist( content ) {
				const blocks = parse( content );
				resetEditorBlocks( blocks );
			},
		};
	} ),
	withInstanceId,
	withPreferredColorScheme,
] )( HTMLTextInput );
