/**
 * External dependencies
 */
import { SafeAreaView } from 'react-native';
import SafeArea from 'react-native-safe-area';
import { sendNativeEditorDidLayout } from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { HTMLTextInput, KeyboardAvoidingView, ReadableContentView } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import Header from '../header';
import VisualEditor from '../visual-editor';

class Layout extends Component {
	constructor() {
		super( ...arguments );

		this.onSafeAreaInsetsUpdate = this.onSafeAreaInsetsUpdate.bind( this );
		this.onRootViewLayout = this.onRootViewLayout.bind( this );

		this.state = {
			rootViewHeight: 0,
			safeAreaBottomInset: 0,
			isFullyBordered: true,
		};

		SafeArea.getSafeAreaInsetsForRootView().then( this.onSafeAreaInsetsUpdate );
	}

	componentDidMount() {
		this._isMounted = true;
		SafeArea.addEventListener( 'safeAreaInsetsForRootViewDidChange', this.onSafeAreaInsetsUpdate );
	}

	componentWillUnmount() {
		SafeArea.removeEventListener( 'safeAreaInsetsForRootViewDidChange', this.onSafeAreaInsetsUpdate );
		this._isMounted = false;
	}

	onSafeAreaInsetsUpdate( result ) {
		const { safeAreaInsets } = result;
		if ( this._isMounted && this.state.safeAreaBottomInset !== safeAreaInsets.bottom ) {
			this.setState( { safeAreaBottomInset: safeAreaInsets.bottom } );
		}
	}

	onRootViewLayout( event ) {
		if ( this._isMounted ) {
			this.setHeightState( event );
			this.setBorderStyleState();
		}
	}

	setHeightState( event ) {
		const { height } = event.nativeEvent.layout;
		this.setState( { rootViewHeight: height }, sendNativeEditorDidLayout );
	}

	setBorderStyleState() {
		const isFullyBordered = ReadableContentView.isContentMaxWidth();
		if ( isFullyBordered !== this.state.isFullyBordered ) {
			this.setState( { isFullyBordered } );
		}
	}

	renderHTML() {
		return (
			<HTMLTextInput
				parentHeight={ this.state.rootViewHeight }
			/>
		);
	}

	renderVisual() {
		const {
			isReady,
		} = this.props;

		if ( ! isReady ) {
			return null;
		}

		return (
			<VisualEditor
				isFullyBordered={ this.state.isFullyBordered }
				rootViewHeight={ this.state.rootViewHeight }
				safeAreaBottomInset={ this.state.safeAreaBottomInset }
				setTitleRef={ this.props.setTitleRef }
			/>
		);
	}

	render() {
		const {
			mode,
		} = this.props;

		return (
			<SafeAreaView style={ styles.container } onLayout={ this.onRootViewLayout }>
				{ mode === 'text' ? this.renderHTML() : this.renderVisual() }
				<KeyboardAvoidingView
					style={ styles.toolbarKeyboardAvoidingView }
					parentHeight={ this.state.rootViewHeight }>
					<Header />
				</KeyboardAvoidingView>
			</SafeAreaView>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			__unstableIsEditorReady: isEditorReady,
		} = select( 'core/editor' );
		const {
			getEditorMode,
		} = select( 'core/edit-post' );

		return {
			isReady: isEditorReady(),
			mode: getEditorMode(),
		};
	} ),
] )( Layout );
