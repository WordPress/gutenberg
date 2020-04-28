/**
 * External dependencies
 */
import { View } from 'react-native';
// import { View, KeyboardAvoidingView, ScrollView } from 'react-native';
// import { HeaderHeightContext } from '@react-navigation/stack';
import BottomSheet from 'reanimated-bottom-sheet';

function ModalScreen( { route, navigation } ) {
	const renderContent = () => {
		return (
			<View style={ { backgroundColor: 'white' } }>
				{ route.params.renderBottomSheet( navigation ) }
			</View>
		);
	};

	return (
		<BottomSheet
			renderContent={ renderContent }
			snapPoints={ [ 300, 0 ] }
			initialSnap={ [ 0 ] }
			onCloseEnd={ () => navigation.popToTop() }
		/>
	);
}

{
	/* <View style={{flex: 1, justifyContent: 'flex-end'}}>
		<HeaderHeightContext.Consumer>
			{headerHeight => (
				<KeyboardAvoidingView
					{...(Platform.OS === "ios" ? { behavior: "padding" } : {})}
					contentContainerStyle={{flex: 1}}
					keyboardVerticalOffset={headerHeight + 100}
				>
				<ScrollView
					//style={{maxHeight: 400}}
					contentContainerStyle={{backgroundColor: 'white'}}
				>
					{route.params.renderBottomSheet( navigation )}
				</ScrollView>
				</KeyboardAvoidingView>
  			 )}
		</HeaderHeightContext.Consumer>
	</View> */
}
export default ModalScreen;
