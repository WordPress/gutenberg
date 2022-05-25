/**
 * External dependencies
 */
import { View } from 'react-native';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import {
	__experimentalRichText as RichText,
	create,
	insert,
} from '@wordpress/rich-text';
import { decodeEntities } from '@wordpress/html-entities';
import { withDispatch, withSelect } from '@wordpress/data';
import { withFocusOutside } from '@wordpress/components';
import { withInstanceId, compose } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { pasteHandler } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import styles from './style.scss';

class PostTitle extends Component {
	constructor( props ) {
		super( props );

		this.setRef = this.setRef.bind( this );
	}
	componentDidUpdate( prevProps ) {
		// Unselect if any other block is selected and blur the RichText.
		if (
			this.props.isSelected &&
			! prevProps.isAnyBlockSelected &&
			this.props.isAnyBlockSelected
		) {
			if ( this.richTextRef ) {
				this.richTextRef.blur();
			}
			this.props.onUnselect();
		}
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
		this.props.onSelect();
	}

	onPaste( { value, onChange, plainText } ) {
		const content = pasteHandler( {
			plainText,
			mode: 'INLINE',
			tagName: 'p',
		} );

		if ( typeof content === 'string' ) {
			const valueToInsert = create( { html: content } );
			onChange( insert( value, valueToInsert ) );
		}
	}

	setRef( richText ) {
		this.richTextRef = richText;
	}

	getTitle( title, postType ) {
		if ( 'page' === postType ) {
			return isEmpty( title )
				? /* translators: accessibility text. empty page title. */
				  __( 'Page title. Empty' )
				: sprintf(
						/* translators: accessibility text. %s: text content of the page title. */
						__( 'Page title. %s' ),
						title
				  );
		}

		return isEmpty( title )
			? /* translators: accessibility text. empty post title. */
			  __( 'Post title. Empty' )
			: sprintf(
					/* translators: accessibility text. %s: text content of the post title. */
					__( 'Post title. %s' ),
					title
			  );
	}

	render() {
		const {
			placeholder,
			style,
			title,
			focusedBorderColor,
			borderStyle,
			isDimmed,
			postType,
			globalStyles,
		} = this.props;

		const decodedPlaceholder = decodeEntities( placeholder );
		const borderColor = this.props.isSelected
			? focusedBorderColor
			: 'transparent';
		const titleStyles = {
			...style,
			...( globalStyles?.text && {
				color: globalStyles.text,
				placeholderColor: globalStyles.text,
			} ),
		};

		return (
			<View
				style={ [
					styles.titleContainer,
					borderStyle,
					{ borderColor },
					isDimmed && styles.dimmed,
				] }
				accessible={ ! this.props.isSelected }
				accessibilityLabel={ this.getTitle( title, postType ) }
				accessibilityHint={ __( 'Updates the title.' ) }
			>
				<RichText
					setRef={ this.setRef }
					accessibilityLabel={ this.getTitle( title, postType ) }
					tagName={ 'p' }
					tagsToEliminate={ [ 'strong' ] }
					unstableOnFocus={ this.props.onSelect }
					onBlur={ this.props.onBlur } // Always assign onBlur as a props.
					multiline={ false }
					style={ titleStyles }
					styles={ styles }
					fontSize={ 24 }
					lineHeight={ 1 }
					fontWeight={ 'bold' }
					deleteEnter={ true }
					onChange={ ( value ) => {
						this.props.onUpdate( value );
					} }
					onPaste={ this.onPaste }
					placeholder={ decodedPlaceholder }
					value={ title }
					onSelectionChange={ () => {} }
					onEnter={ this.props.onEnterPress }
					disableEditingMenu={ true }
					__unstableIsSelected={ this.props.isSelected }
					__unstableOnCreateUndoLevel={ () => {} }
				></RichText>
			</View>
		);
	}
}

export default compose(
	withSelect( ( select ) => {
		const { isPostTitleSelected, getEditedPostAttribute } = select(
			editorStore
		);
		const {
			getSelectedBlockClientId,
			getBlockRootClientId,
			getSettings,
		} = select( blockEditorStore );

		const selectedId = getSelectedBlockClientId();
		const selectionIsNested = !! getBlockRootClientId( selectedId );
		const globalStyles = getSettings()?.__experimentalGlobalStylesBaseStyles
			?.color;

		return {
			postType: getEditedPostAttribute( 'type' ),
			isAnyBlockSelected: !! selectedId,
			isSelected: isPostTitleSelected(),
			isDimmed: selectionIsNested,
			globalStyles,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { undo, redo, togglePostTitleSelection } = dispatch(
			editorStore
		);

		const { clearSelectedBlock, insertDefaultBlock } = dispatch(
			blockEditorStore
		);

		return {
			onEnterPress() {
				insertDefaultBlock( undefined, undefined, 0 );
			},
			onUndo: undo,
			onRedo: redo,
			onSelect() {
				togglePostTitleSelection( true );
				clearSelectedBlock();
			},
			onUnselect() {
				togglePostTitleSelection( false );
			},
		};
	} ),
	withInstanceId,
	withFocusOutside
)( PostTitle );
