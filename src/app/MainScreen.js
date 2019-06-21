/** @flow
 * @format */

/**
 * External dependencies
 */
import React from 'react';
import { type InputText, LayoutChangeEvent, SafeAreaView } from 'react-native';
import SafeArea from 'react-native-safe-area';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { HTMLTextInput, ReadableContentView } from '@wordpress/components';
import { VisualEditor } from '@wordpress/edit-post';

/**
 * Internal dependencies
 */
import styles from './style.scss';

type PropsType = {
	isReady: boolean,
	mode: string,
	onNativeEditorDidLayout: () => ?mixed,
	setTitleRef: ?InputText => void,
};

type StateType = {
	rootViewHeight: number,
	safeAreaBottomInset: number,
	isFullyBordered: boolean,
};

// TODO: Move MainScreen to gutenberg/packages/edit-post/src/components/layout/index.js
class MainScreen extends React.Component<PropsType, StateType> {
	_isMounted: boolean;

	constructor( props: PropsType ) {
		super( props );

		( this: any ).onSafeAreaInsetsUpdate = this.onSafeAreaInsetsUpdate.bind( this );
		( this: any ).onRootViewLayout = this.onRootViewLayout.bind( this );

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

	onRootViewLayout( event: LayoutChangeEvent ) {
		if ( this._isMounted ) {
			this.setHeightState( event );
			this.setBorderStyleState();
		}
	}

	setHeightState( event: LayoutChangeEvent ) {
		const { height } = event.nativeEvent.layout;
		this.setState( { rootViewHeight: height }, this.props.onNativeEditorDidLayout );
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
] )( MainScreen );
