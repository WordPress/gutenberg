/**
 * External dependencies
 */
import { TextInput } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { parse } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { addAction, removeAction } from '@wordpress/hooks';
import { withInstanceId, compose, withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import HTMLInputContainer from './container';
import styles from './style.scss';

export class HTMLTextInput extends Component {
	constructor() {
		super( ...arguments );

		this.edit = this.edit.bind( this );
		this.stopEditing = this.stopEditing.bind( this );
		addAction( 'native-editor.persist-html', 'core/editor', this.stopEditing );

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
		removeAction( 'native-editor.persist-html', 'core/editor' );
		//TODO: Blocking main thread
		this.stopEditing();
	}

	edit( html ) {
		this.props.onChange( html );
		this.setState( { value: html, isDirty: true } );
	}

	stopEditing() {
		if ( this.state.isDirty ) {
			this.props.onPersist( this.state.value );
			this.setState( { isDirty: false } );
		}
	}

	render() {
		const { getStylesFromColorScheme } = this.props;
		const htmlStyle = getStylesFromColorScheme( styles.htmlView, styles.htmlViewDark );
		const placeholderStyle = getStylesFromColorScheme( styles.placeholder, styles.placeholderDark );
		return (
			<HTMLInputContainer parentHeight={ this.props.parentHeight }>
				<TextInput
					autoCorrect={ false }
					accessibilityLabel="html-view-title"
					textAlignVertical="center"
					numberOfLines={ 1 }
					style={ styles.htmlViewTitle }
					value={ this.props.title }
					placeholder={ __( 'Add title' ) }
					placeholderTextColor={ placeholderStyle.color }
					onChangeText={ this.props.editTitle }
				/>
				<TextInput
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
					scrollEnabled={ HTMLInputContainer.scrollEnabled }
				/>
			</HTMLInputContainer>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getEditedPostAttribute,
			getEditedPostContent,
		} = select( 'core/editor' );

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
