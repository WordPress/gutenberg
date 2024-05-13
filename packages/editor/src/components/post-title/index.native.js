/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { create, toHTMLString, insert } from '@wordpress/rich-text';
import { decodeEntities } from '@wordpress/html-entities';
import { withDispatch, withSelect } from '@wordpress/data';
import { withFocusOutside } from '@wordpress/components';
import { withInstanceId, compose } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { pasteHandler } from '@wordpress/blocks';
import { store as blockEditorStore, RichText } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import styles from './style.scss';

class PostTitle extends Component {
	constructor( props ) {
		super( props );

		this.setRef = this.setRef.bind( this );
		this.onPaste = this.onPaste.bind( this );
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

	onPaste( { value, plainText, html } ) {
		const { title, onInsertBlockAfter, onUpdate } = this.props;

		const content = pasteHandler( {
			HTML: html,
			plainText,
		} );

		if ( ! content.length ) {
			return;
		}

		if ( typeof content !== 'string' ) {
			const [ firstBlock ] = content;

			if (
				! title &&
				( firstBlock.name === 'core/heading' ||
					firstBlock.name === 'core/paragraph' )
			) {
				// Strip HTML to avoid unwanted HTML being added to the title.
				// In the majority of cases it is assumed that HTML in the title
				// is undesirable.
				const contentNoHTML = stripHTML(
					firstBlock.attributes.content
				);
				onUpdate( contentNoHTML );
				onInsertBlockAfter( content.slice( 1 ) );
			} else {
				onInsertBlockAfter( content );
			}
		} else {
			// Strip HTML to avoid unwanted HTML being added to the title.
			// In the majority of cases it is assumed that HTML in the title
			// is undesirable.
			const contentNoHTML = stripHTML( content );

			const newValue = insert( value, create( { html: contentNoHTML } ) );
			onUpdate( toHTMLString( { value: newValue } ) );
		}
	}

	setRef( richText ) {
		this.richTextRef = richText;
	}

	getTitle( title, postType ) {
		if ( 'page' === postType ) {
			return ! title
				? /* translators: accessibility text. empty page title. */
				  __( 'Page title. Empty' )
				: sprintf(
						/* translators: accessibility text. %s: text content of the page title. */
						__( 'Page title. %s' ),
						title
				  );
		}

		return ! title
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
				testID="post-title"
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
				<RichText.Raw
					ref={ this.setRef }
					accessibilityLabel={ this.getTitle( title, postType ) }
					tagName={ 'p' }
					tagsToEliminate={ [ 'strong' ] }
					unstableOnFocus={ this.props.onSelect }
					onBlur={ this.props.onBlur } // Always assign onBlur as a props.
					style={ titleStyles }
					styles={ styles }
					fontSize={ 24 }
					lineHeight={ 1 }
					fontWeight={ 'bold' }
					deleteEnter
					onChange={ ( value ) => {
						this.props.onUpdate( value );
					} }
					onPaste={ this.onPaste }
					placeholder={ decodedPlaceholder }
					value={ title }
					onSelectionChange={ () => {} }
					onEnter={ this.props.onEnterPress }
					disableEditingMenu
					__unstableIsSelected={ this.props.isSelected }
					__unstableOnCreateUndoLevel={ () => {} }
				/>
			</View>
		);
	}
}

export default compose(
	withSelect( ( select ) => {
		const { isPostTitleSelected, getEditedPostAttribute } =
			select( editorStore );
		const { getSelectedBlockClientId, getBlockRootClientId, getSettings } =
			select( blockEditorStore );

		const selectedId = getSelectedBlockClientId();
		const selectionIsNested = !! getBlockRootClientId( selectedId );
		const globalStyles =
			getSettings()?.__experimentalGlobalStylesBaseStyles?.color;

		return {
			postType: getEditedPostAttribute( 'type' ),
			title: getEditedPostAttribute( 'title' ),
			isAnyBlockSelected: !! selectedId,
			isSelected: isPostTitleSelected(),
			isDimmed: selectionIsNested,
			globalStyles,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { undo, redo, togglePostTitleSelection, editPost } =
			dispatch( editorStore );

		const { clearSelectedBlock, insertDefaultBlock, insertBlocks } =
			dispatch( blockEditorStore );

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
			onUpdate( title ) {
				editPost( { title } );
			},
			onInsertBlockAfter( blocks ) {
				insertBlocks( blocks, 0 );
			},
		};
	} ),
	withInstanceId,
	withFocusOutside
)( PostTitle );
