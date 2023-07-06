/**
 * External dependencies
 */
import { Platform, ScrollView, View, useWindowDimensions } from 'react-native';

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
import { keyboardClose } from '@wordpress/icons';
import { store as editorStore } from '@wordpress/editor';
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
	onHideKeyboard,
	isRTL,
	noContentSelected,
} ) {
	const wasNoContentSelected = useRef( noContentSelected );
	const [ isInserterOpen, setIsInserterOpen ] = useState( false );
	const { height: windowHeight, width: windowWidth } = useWindowDimensions();
	const isLandscape = windowWidth >= windowHeight;

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

	// When the orientation changes, updating of the undo/redo buttons
	// is needed for Android.
	useEffect( () => {
		toggleUndoButton( ! hasUndo );
		toggleRedoButton( ! hasRedo );
	}, [ isLandscape, hasUndo, hasRedo ] );

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
				<BlockToolbar />
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
		const { clearSelectedBlock } = dispatch( blockEditorStore );
		const { togglePostTitleSelection } = dispatch( editorStore );

		return {
			redo: dispatch( editorStore ).redo,
			undo: dispatch( editorStore ).undo,
			onHideKeyboard() {
				clearSelectedBlock();
				togglePostTitleSelection( false );
			},
		};
	} ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
	withPreferredColorScheme,
] )( HeaderToolbar );
