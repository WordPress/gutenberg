/**
 * External dependencies
 */
import { Platform, SafeAreaView, View } from 'react-native';
import SafeArea from 'react-native-safe-area';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import {
	BottomSheetSettings,
	FloatingToolbar,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import {
	HTMLTextInput,
	KeyboardAvoidingView,
	NoticeList,
	Tooltip,
	__unstableAutocompletionItemsSlot as AutocompletionItemsSlot,
} from '@wordpress/components';
import { AutosaveMonitor, store as editorStore } from '@wordpress/editor';
import { sendNativeEditorDidLayout } from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import headerToolbarStyles from '../header/header-toolbar/style.scss';
import Header from '../header';
import VisualEditor from '../visual-editor';
import { store as editPostStore } from '../../store';

class Layout extends Component {
	constructor() {
		super( ...arguments );

		this.onSafeAreaInsetsUpdate = this.onSafeAreaInsetsUpdate.bind( this );
		this.onRootViewLayout = this.onRootViewLayout.bind( this );

		this.state = {
			rootViewHeight: 0,
			safeAreaInsets: { top: 0, bottom: 0, right: 0, left: 0 },
		};

		SafeArea.getSafeAreaInsetsForRootView().then(
			this.onSafeAreaInsetsUpdate
		);
	}

	componentDidMount() {
		this._isMounted = true;
		this.safeAreaSubscription = SafeArea.addEventListener(
			'safeAreaInsetsForRootViewDidChange',
			this.onSafeAreaInsetsUpdate
		);
	}

	componentWillUnmount() {
		this.safeAreaSubscription?.remove();
		this._isMounted = false;
	}

	onSafeAreaInsetsUpdate( result ) {
		const { safeAreaInsets } = result;
		if ( this._isMounted ) {
			this.setState( { safeAreaInsets } );
		}
	}

	onRootViewLayout( event ) {
		if ( this._isMounted ) {
			this.setHeightState( event );
		}
	}

	setHeightState( event ) {
		const { height } = event.nativeEvent.layout;
		if ( height !== this.state.rootViewHeight ) {
			this.setState(
				{ rootViewHeight: height },
				sendNativeEditorDidLayout
			);
		}
	}

	renderHTML() {
		const { globalStyles } = this.props;
		return (
			<HTMLTextInput
				parentHeight={ this.state.rootViewHeight }
				style={ globalStyles }
			/>
		);
	}

	renderVisual() {
		const { isReady } = this.props;

		if ( ! isReady ) {
			return null;
		}

		return <VisualEditor setTitleRef={ this.props.setTitleRef } />;
	}

	render() {
		const { getStylesFromColorScheme, mode, globalStyles } = this.props;

		const isHtmlView = mode === 'text';

		// Add a margin view at the bottom for the header.
		const marginBottom =
			Platform.OS === 'android' && ! isHtmlView
				? headerToolbarStyles.container.height
				: 0;

		const toolbarKeyboardAvoidingViewStyle = {
			...styles.toolbarKeyboardAvoidingView,
			left: this.state.safeAreaInsets.left,
			right: this.state.safeAreaInsets.right,
			bottom: this.state.safeAreaInsets.bottom,
		};

		const editorStyles = [
			getStylesFromColorScheme(
				styles.background,
				styles.backgroundDark
			),
			globalStyles?.background && {
				backgroundColor: globalStyles.background,
			},
		];

		return (
			<Tooltip.Slot>
				<SafeAreaView
					style={ getStylesFromColorScheme(
						styles.container,
						styles.containerDark
					) }
					onLayout={ this.onRootViewLayout }
				>
					<AutosaveMonitor disableIntervalChecks />
					<View style={ editorStyles }>
						{ isHtmlView ? this.renderHTML() : this.renderVisual() }
						{ ! isHtmlView && Platform.OS === 'android' && (
							<FloatingToolbar />
						) }
						<NoticeList />
					</View>
					<View
						style={ {
							flex: 0,
							flexBasis: marginBottom,
							height: marginBottom,
						} }
					/>
					{ ! isHtmlView && (
						<KeyboardAvoidingView
							parentHeight={ this.state.rootViewHeight }
							style={ toolbarKeyboardAvoidingViewStyle }
							withAnimatedHeight
						>
							{ Platform.OS === 'ios' && (
								<>
									<AutocompletionItemsSlot />
									<FloatingToolbar />
								</>
							) }
							<Header />
							<BottomSheetSettings />
						</KeyboardAvoidingView>
					) }
					{ Platform.OS === 'android' && <AutocompletionItemsSlot /> }
				</SafeAreaView>
			</Tooltip.Slot>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { __unstableIsEditorReady: isEditorReady } = select(
			editorStore
		);
		const { getEditorMode } = select( editPostStore );
		const { getSettings } = select( blockEditorStore );
		const globalStyles = getSettings()?.__experimentalGlobalStylesBaseStyles
			?.color;

		return {
			isReady: isEditorReady(),
			mode: getEditorMode(),
			globalStyles,
		};
	} ),
	withPreferredColorScheme,
] )( Layout );
