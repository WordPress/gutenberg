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
import { withInstanceId, compose } from '@wordpress/compose';

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

		this.state = {
			isDirty: false,
			value: '',
		};
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
					onChangeText={ this.props.editTitle }
				/>
				<TextInput
					autoCorrect={ false }
					accessibilityLabel="html-view-content"
					textAlignVertical="top"
					multiline
					style={ styles.htmlView }
					value={ this.state.value }
					onChangeText={ this.edit }
					onBlur={ this.stopEditing }
					placeholder={ __( 'Start writing…' ) }
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
		const { resetBlocks } = dispatch( 'core/block-editor' );
		const { editPost } = dispatch( 'core/editor' );
		return {
			editTitle( title ) {
				editPost( { title } );
			},
			onChange( content ) {
				editPost( { content } );
			},
			onPersist( content ) {
				resetBlocks( parse( content ) );
			},
		};
	} ),
	withInstanceId,
] )( HTMLTextInput );
