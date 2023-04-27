/**
 * External dependencies
 */
import {
	AccessibilityInfo,
	SafeAreaView,
	View,
	findNodeHandle,
	Platform,
} from 'react-native';

/**
 * WordPress dependencies
 */
import {
	Children,
	useEffect,
	useContext,
	useRef,
	useState,
} from '@wordpress/element';
import { createSlotFill, BottomSheetContext } from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'BottomSheetSubSheet' );

const BottomSheetSubSheet = ( {
	children,
	navigationButton,
	showSheet,
	isFullScreen,
} ) => {
	const { setIsFullScreen } = useContext( BottomSheetContext );
	const [ buttonNode, setButtonNode ] = useState();
	const [ contentNode, setContentNode ] = useState();
	const a11yFocusContent = useRef( false );

	useEffect( () => {
		if ( showSheet ) {
			setIsFullScreen( isFullScreen );
		}
		// Disable reason: deferring this refactor to the native team.
		// see https://github.com/WordPress/gutenberg/pull/41166
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ showSheet, isFullScreen ] );

	useEffect( () => {
		if ( ! showSheet && a11yFocusContent.current && buttonNode ) {
			console.log( 'request a11y focus (button)', buttonNode );
			AccessibilityInfo.setAccessibilityFocus( buttonNode );
			setContentNode( undefined );
			a11yFocusContent.current = false;
		}
		if ( showSheet && ! a11yFocusContent.current && contentNode ) {
			console.log( 'request a11y focus (content)', contentNode );
			AccessibilityInfo.setAccessibilityFocus( contentNode );
			setButtonNode( undefined );
			a11yFocusContent.current = true;
		}
	}, [ showSheet, buttonNode, contentNode ] );

	const updateButtonNode = ( ref ) => {
		if ( ! ref ) {
			return;
		}

		const node = findNodeHandle( ref );
		if ( node && node !== buttonNode ) {
			setButtonNode( node );
		}
	};

	const updateContentNode = ( ref ) => {
		if ( ! ref ) {
			return;
		}

		const node = findNodeHandle( ref );
		if ( node && node !== contentNode ) {
			setContentNode( node );
		}
	};

	return (
		<>
			{ showSheet && (
				<Fill>
					<SafeAreaView
						accessible={ Platform.OS === 'android' }
						ref={ updateContentNode }
					>
						{ children }
					</SafeAreaView>
				</Fill>
			) }
			<View
				accessible={ Platform.OS === 'android' }
				ref={ updateButtonNode }
			>
				{ Children.count( children ) > 0 && navigationButton }
			</View>
		</>
	);
};

BottomSheetSubSheet.Slot = Slot;
BottomSheetSubSheet.screenName = 'BottomSheetSubSheet';

export default BottomSheetSubSheet;
