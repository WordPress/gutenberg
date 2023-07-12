/**
 * External dependencies
 */
import { Platform, ScrollView, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { useCallback, useRef, useState, useEffect } from '@wordpress/element';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
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

function HeaderToolbar( {
	hasRedo,
	hasUndo,
	redo,
	undo,
	showInserter,
	showKeyboardHideButton,
	getStylesFromColorScheme,
	insertBlock,
	onHideKeyboard,
	onOpenBlockSettings,
	isRTL,
	noContentSelected,
} ) {
	const anchorNodeRef = useRef();
	const wasNoContentSelected = useRef( noContentSelected );
	const [ isInserterOpen, setIsInserterOpen ] = useState( false );

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
		const isAndroid = Platform.OS === 'android';
		if ( isAndroid && isRTL ) {
			scrollViewRef.current.scrollToEnd();
		} else {
			scrollViewRef.current.scrollTo( { x: 0 } );
		}
	};

	const onInsertBlock = useCallback(
		( blockType ) => () => {
			insertBlock( createBlock( blockType ), undefined, undefined, true, {
				source: 'inserter_menu',
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

	const onToggleInserter = useCallback(
		( isOpen ) => {
			if ( isOpen ) {
				wasNoContentSelected.current = noContentSelected;
			}
			setIsInserterOpen( isOpen );
		},
		[ noContentSelected ]
	);

	// Expanded mode should be preserved while the inserter is open.
	// This way we prevent style updates during the opening transition.
	const useExpandedMode = isInserterOpen
		? wasNoContentSelected.current
		: noContentSelected;

	/* translators: accessibility text for the editor toolbar */
	const toolbarAriaLabel = __( 'Document tools' );

	return (
		<View
			ref={ anchorNodeRef }
			testID={ toolbarAriaLabel }
			accessibilityLabel={ toolbarAriaLabel }
			style={ [
				getStylesFromColorScheme(
					styles[ 'header-toolbar__container' ],
					styles[ 'header-toolbar__container--dark' ]
				),
				useExpandedMode &&
					styles[ 'header-toolbar__container--expanded' ],
			] }
		>
			<ScrollView
				ref={ scrollViewRef }
				onContentSizeChange={ scrollToStart }
				horizontal={ true }
				showsHorizontalScrollIndicator={ false }
				keyboardShouldPersistTaps="always"
				alwaysBounceHorizontal={ false }
				contentContainerStyle={
					styles[ 'header-toolbar__scrollable-content' ]
				}
			>
				<Inserter
					disabled={ ! showInserter }
					useExpandedMode={ useExpandedMode }
					onToggle={ onToggleInserter }
				/>
				{ noContentSelected && renderMediaButtons }
				<BlockToolbar
					anchorNodeRef={ anchorNodeRef.current }
					onOpenBlockSettings={ onOpenBlockSettings }
				/>
			</ScrollView>
			{ showKeyboardHideButton && (
				<ToolbarGroup
					passedStyle={
						styles[ 'header-toolbar__keyboard-hide-container' ]
					}
				>
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
		const { openGeneralSidebar } = dispatch( editPostStore );
		const { togglePostTitleSelection } = dispatch( editorStore );

		return {
			redo: dispatch( editorStore ).redo,
			undo: dispatch( editorStore ).undo,
			onHideKeyboard() {
				clearSelectedBlock();
				togglePostTitleSelection( false );
			},
			insertBlock,
			onOpenBlockSettings() {
				openGeneralSidebar( 'edit-post/block' );
			},
		};
	} ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
	withPreferredColorScheme,
] )( HeaderToolbar );
