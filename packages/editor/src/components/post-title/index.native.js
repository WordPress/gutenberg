/**
 * External dependencies
 */
import { View } from 'react-native';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { RichText } from '@wordpress/rich-text';
import { decodeEntities } from '@wordpress/html-entities';
import { withDispatch } from '@wordpress/data';
import { withFocusOutside } from '@wordpress/components';
import { withInstanceId, compose } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { pasteHandler } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import styles from './style.scss';

class PostTitle extends Component {
	constructor() {
		super( ...arguments );

		this.titleViewRef = null;
	}

	componentDidMount() {
		if ( this.props.innerRef ) {
			this.props.innerRef( this );
		}
	}

	handleFocusOutside() {
		this.props.onUnselect();
	}

	focus() {
		if ( this.titleViewRef ) {
			this.titleViewRef.focus();
			this.props.onSelect();
		}
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
		const borderColor = this.props.isSelected ? focusedBorderColor : 'transparent';

		return (
			<View
				style={ [ styles.titleContainer, borderStyle, { borderColor } ] }
				accessible={ ! this.props.isSelected }
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
				<RichText
					tagName={ 'p' }
					rootTagsToEliminate={ [ 'strong' ] }
					unstableOnFocus={ this.props.onSelect }
					onBlur={ this.props.onBlur } // always assign onBlur as a props
					multiline={ false }
					style={ style }
					styles={ styles }
					fontSize={ 24 }
					fontWeight={ 'bold' }
					deleteEnter={ true }
					onChange={ ( value ) => {
						this.props.onUpdate( value );
					} }
					placeholder={ decodedPlaceholder }
					value={ title }
					onSelectionChange={ () => { } }
					onEnter={ this.props.onEnterPress }
					disableEditingMenu={ true }
					setRef={ ( ref ) => {
						this.titleViewRef = ref;
					} }
					__unstablePasteHandler={ pasteHandler }
				>
				</RichText>
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
	} = dispatch( 'core/block-editor' );

	return {
		onEnterPress() {
			insertDefaultBlock( undefined, undefined, 0 );
		},
		onUndo: undo,
		onRedo: redo,
	};
} );

export default compose(
	applyWithDispatch,
	withInstanceId,
	withFocusOutside
)( PostTitle );
