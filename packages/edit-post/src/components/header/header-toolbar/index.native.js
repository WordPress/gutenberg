/**
 * External dependencies
 */
import { ScrollView, StyleSheet, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { useCallback, useRef, useEffect, Platform } from '@wordpress/element';
import { compose, usePreferredColorSchemeStyle } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';
import { __ } from '@wordpress/i18n';
import {
	Inserter,
	BlockToolbar,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import {
	keyboardClose,
	audio as audioIcon,
	media as imageIcon,
	video as videoIcon,
	gallery as galleryIcon,
} from '@wordpress/icons';
import { store as editorStore } from '@wordpress/editor';
import { createBlock } from '@wordpress/blocks';
import {
	toggleUndoButton,
	toggleRedoButton,
	subscribeOnUndoPressed,
	subscribeOnRedoPressed,
} from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import { store as editPostStore } from '../../../store';

const shadowStyle = {
	shadowOffset: { width: 2, height: 2 },
	shadowOpacity: 1,
	shadowRadius: 6,
	elevation: 18,
};

function HeaderToolbar( {
	hasRedo,
	hasUndo,
	redo,
	undo,
	showInserter,
	showKeyboardHideButton,
	insertBlock,
	onHideKeyboard,
	isRTL,
	noContentSelected,
} ) {
	const anchorNodeRef = useRef();

	const containerStyle = [
		usePreferredColorSchemeStyle(
			styles[ 'header-toolbar__container' ],
			styles[ 'header-toolbar__container--dark' ]
		),
		{ borderTopWidth: StyleSheet.hairlineWidth },
	];

	useEffect( () => {
		const onUndoSubscription = subscribeOnUndoPressed( undo );
		const onRedoSubscription = subscribeOnRedoPressed( redo );

		return () => {
			onUndoSubscription?.remove();
			onRedoSubscription?.remove();
		};
	}, [ undo, redo ] );

	useEffect( () => {
		toggleUndoButton( ! hasUndo );
	}, [ hasUndo ] );

	useEffect( () => {
		toggleRedoButton( ! hasRedo );
	}, [ hasRedo ] );

	const scrollViewRef = useRef( null );
	const scrollToStart = () => {
		// scrollview doesn't seem to automatically adjust to RTL on Android so, scroll to end when Android
		if ( Platform.isAndroid && isRTL ) {
			scrollViewRef.current.scrollToEnd();
		} else {
			scrollViewRef.current.scrollTo( { x: 0 } );
		}
	};

	const onInsertBlock = useCallback(
		( blockType ) => () => {
			insertBlock( createBlock( blockType ), undefined, undefined, true, {
				source: 'inserter_menu',
				inserterMethod: 'quick-inserter',
			} );
		},
		[ insertBlock ]
	);

	const renderMediaButtons = (
		<ToolbarGroup>
			<ToolbarButton
				key="imageButton"
				title={ __( 'Image' ) }
				icon={ imageIcon }
				onClick={ onInsertBlock( 'core/image' ) }
				testID="insert-image-button"
				extraProps={ {
					hint: __( 'Insert Image Block' ),
				} }
			/>
			<ToolbarButton
				key="videoButton"
				title={ __( 'Video' ) }
				icon={ videoIcon }
				onClick={ onInsertBlock( 'core/video' ) }
				testID="insert-video-button"
				extraProps={ {
					hint: __( 'Insert Video Block' ),
				} }
			/>
			<ToolbarButton
				key="galleryButton"
				title={ __( 'Gallery' ) }
				icon={ galleryIcon }
				onClick={ onInsertBlock( 'core/gallery' ) }
				testID="insert-gallery-button"
				extraProps={ {
					hint: __( 'Insert Gallery Block' ),
				} }
			/>
			<ToolbarButton
				key="audioButton"
				title={ __( 'Audio' ) }
				icon={ audioIcon }
				onClick={ onInsertBlock( 'core/audio' ) }
				testID="insert-audio-button"
				extraProps={ {
					hint: __( 'Insert Audio Block' ),
				} }
			/>
		</ToolbarGroup>
	);

	/* translators: accessibility text for the editor toolbar */
	const toolbarAriaLabel = __( 'Document tools' );

	const shadowColor = usePreferredColorSchemeStyle(
		styles[ 'header-toolbar__keyboard-hide-shadow--light' ],
		styles[ 'header-toolbar__keyboard-hide-shadow--dark' ]
	);
	const showKeyboardButtonStyles = [
		usePreferredColorSchemeStyle(
			styles[ 'header-toolbar__keyboard-hide-container' ],
			styles[ 'header-toolbar__keyboard-hide-container--dark' ]
		),
		shadowStyle,
		{
			shadowColor: Platform.isAndroid
				? styles[ 'header-toolbar__keyboard-hide-shadow--solid' ].color
				: shadowColor.color,
		},
	];

	return (
		<View
			ref={ anchorNodeRef }
			testID={ toolbarAriaLabel }
			accessibilityLabel={ toolbarAriaLabel }
			style={ containerStyle }
		>
			<ScrollView
				ref={ scrollViewRef }
				onContentSizeChange={ scrollToStart }
				horizontal
				showsHorizontalScrollIndicator={ false }
				keyboardShouldPersistTaps="always"
				alwaysBounceHorizontal={ false }
				contentContainerStyle={
					styles[ 'header-toolbar__scrollable-content' ]
				}
			>
				<Inserter disabled={ ! showInserter } />

				{ noContentSelected && renderMediaButtons }
				<BlockToolbar anchorNodeRef={ anchorNodeRef.current } />
			</ScrollView>
			{ showKeyboardHideButton && (
				<ToolbarGroup passedStyle={ showKeyboardButtonStyles }>
					<ToolbarButton
						title={ __( 'Hide keyboard' ) }
						icon={ keyboardClose }
						onClick={ onHideKeyboard }
						extraProps={ {
							hint: __( 'Tap to hide the keyboard' ),
						} }
					/>
				</ToolbarGroup>
			) }
		</View>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getBlockRootClientId,
			getBlockSelectionEnd,
			hasInserterItems,
			hasSelectedBlock,
		} = select( blockEditorStore );
		const { getEditorSettings } = select( editorStore );
		const isAnyBlockSelected = hasSelectedBlock();
		return {
			hasRedo: select( editorStore ).hasEditorRedo(),
			hasUndo: select( editorStore ).hasEditorUndo(),
			// This setting (richEditingEnabled) should not live in the block editor's setting.
			showInserter:
				select( editPostStore ).getEditorMode() === 'visual' &&
				getEditorSettings().richEditingEnabled &&
				hasInserterItems(
					getBlockRootClientId( getBlockSelectionEnd() )
				),
			isTextModeEnabled:
				select( editPostStore ).getEditorMode() === 'text',
			isRTL: select( blockEditorStore ).getSettings().isRTL,
			noContentSelected: ! isAnyBlockSelected,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { clearSelectedBlock, insertBlock } =
			dispatch( blockEditorStore );
		const { togglePostTitleSelection } = dispatch( editorStore );

		return {
			redo: dispatch( editorStore ).redo,
			undo: dispatch( editorStore ).undo,
			onHideKeyboard() {
				clearSelectedBlock();
				togglePostTitleSelection( false );
			},
			insertBlock,
		};
	} ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
] )( HeaderToolbar );
