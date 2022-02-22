/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { BlockList } from '@wordpress/block-editor';
/**
 * External dependencies
 */
import { Keyboard, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
} from 'react-native-reanimated';
/**
 * Internal dependencies
 */
import Header from './header';

const TestComponent = () => {
	const ballStyles = StyleSheet.create( {
		container: {
			position: 'absolute',
			bottom: 16,
			right: 16,
			zIndex: 10,
		},
		ball: {
			width: 100,
			height: 100,
			borderRadius: 100,
			backgroundColor: 'blue',
		},
	} );

	const isPressed = useSharedValue( false );
	const offset = useSharedValue( { x: 0, y: 0 } );
	const animatedStyles = useAnimatedStyle( () => {
		return {
			transform: [
				{ translateX: offset.value.x },
				{ translateY: offset.value.y },
				{ scale: withSpring( isPressed.value ? 1.2 : 1 ) },
			],
			backgroundColor: isPressed.value ? 'yellow' : 'blue',
		};
	} );

	const start = useSharedValue( { x: 0, y: 0 } );
	const gesture = Gesture.Pan()
		.onBegin( () => {
			isPressed.value = true;
		} )
		.onUpdate( ( e ) => {
			offset.value = {
				x: e.translationX + start.value.x,
				y: e.translationY + start.value.y,
			};
		} )
		.onEnd( () => {
			start.value = {
				x: offset.value.x,
				y: offset.value.y,
			};
		} )
		.onFinalize( () => {
			isPressed.value = false;
		} );

	return (
		<View style={ ballStyles.container }>
			<GestureDetector gesture={ gesture }>
				<Animated.View style={ [ ballStyles.ball, animatedStyles ] } />
			</GestureDetector>
		</View>
	);
};

export default class VisualEditor extends Component {
	constructor( props ) {
		super( props );
		this.renderHeader = this.renderHeader.bind( this );
		this.keyboardDidShow = this.keyboardDidShow.bind( this );
		this.keyboardDidHide = this.keyboardDidHide.bind( this );

		this.state = {
			isAutoScrollEnabled: true,
		};
	}

	componentDidMount() {
		this.keyboardDidShow = Keyboard.addListener(
			'keyboardDidShow',
			this.keyboardDidShow
		);
		this.keyboardDidHideListener = Keyboard.addListener(
			'keyboardDidHide',
			this.keyboardDidHide
		);
	}

	componentWillUnmount() {
		this.keyboardDidShow.remove();
		this.keyboardDidHideListener.remove();
	}

	keyboardDidShow() {
		this.setState( { isAutoScrollEnabled: false } );
	}

	keyboardDidHide() {
		this.setState( { isAutoScrollEnabled: true } );
	}

	renderHeader() {
		const { setTitleRef } = this.props;
		return <Header setTitleRef={ setTitleRef } />;
	}

	render() {
		const { safeAreaBottomInset } = this.props;
		const { isAutoScrollEnabled } = this.state;

		return (
			<>
				<TestComponent />
				<BlockList
					header={ this.renderHeader }
					safeAreaBottomInset={ safeAreaBottomInset }
					autoScroll={ isAutoScrollEnabled }
				/>
			</>
		);
	}
}
