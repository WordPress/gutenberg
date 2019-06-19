/**
 * External dependencies
 */
import { View, Platform } from 'react-native';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { PlainText } from '@wordpress/block-editor';
import { decodeEntities } from '@wordpress/html-entities';
import { withDispatch } from '@wordpress/data';
import { withFocusOutside } from '@wordpress/components';
import { withInstanceId, compose } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';

class PostTitle extends Component {
	constructor() {
		super( ...arguments );

		this.onSelect = this.onSelect.bind( this );
		this.onUnselect = this.onUnselect.bind( this );
		this.titleViewRef = null;

		this.state = {
			isSelected: false,
		};

		this.isIOS = Platform.OS === 'ios';
	}

	componentDidMount() {
		if ( this.props.innerRef ) {
			this.props.innerRef( this );
		}
	}

	handleFocusOutside() {
		this.onUnselect();
	}

	focus() {
		if ( this.titleViewRef ) {
			this.titleViewRef.focus();
			this.setState( { isSelected: true } );
		}
	}

	onSelect() {
		this.setState( { isSelected: true } );
		this.props.clearSelectedBlock();
	}

	onUnselect() {
		this.setState( { isSelected: false } );
	}

	render() {
		const {
			placeholder,
			style,
			title,
			focusedBorderColor,
			borderStyle,
		} = this.props;

		const decodedPlaceholder = decodeEntities( placeholder );
		const borderColor = this.state.isSelected ? focusedBorderColor : 'transparent';
		
		return (
			<View
				style={ [ styles.titleContainer, borderStyle, { borderColor } ] }
				accessible={ ! this.state.isSelected }
				accessibilityLabel={
					isEmpty( title ) ?
						/* translators: accessibility text. empty post title. */
						__( 'Post title. Empty' ) :
						sprintf(
							/* translators: accessibility text. %s: text content of the post title. */
							__( 'Post title. %s' ),
							title
						)
				}
			>
				<PlainText
					onFocus={ this.onSelect }
					onBlur={ this.props.onBlur }
					multiline={ false }
					style={ style }
					fontSize={ 24 }
					fontWeight={ 'bold' }
					onChange={ ( value ) => {
						this.props.onUpdate( value );
					} }
					placeholder={ decodedPlaceholder }
					value={ title }
					returnKeyType={ this.isIOS ? 'default' : 'none' }
					onEnter={ this.props.onEnterPress }
					ref={ ( ref ) => {
						this.titleViewRef = ref;
					} }
				/>
			</View>
		);
	}
}

const applyWithDispatch = withDispatch( ( dispatch ) => {
	const {
		undo,
		redo,
	} = dispatch( 'core/editor' );

	const {
		insertDefaultBlock,
		clearSelectedBlock,
	} = dispatch( 'core/block-editor' );

	return {
		onEnterPress() {
			insertDefaultBlock( undefined, undefined, 0 );
		},
		onUndo: undo,
		onRedo: redo,
		clearSelectedBlock,
	};
} );

export default compose(
	applyWithDispatch,
	withInstanceId,
	withFocusOutside
)( PostTitle );
