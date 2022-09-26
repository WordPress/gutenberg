# BottomSheetSubSheet

BottomSheetSubSheet allows for adding controls inside the React Native bottom sheet settings.

### Usage

```jsx
/**
 * External dependencies
 */
import { SafeAreaView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Icon, chevronRight } from '@wordpress/icons';
import { BottomSheet } from '@wordpress/components';

const ExampleControl = () => {
	const [ showSubSheet, setShowSubSheet ] = useState( false );
	const navigation = useNavigation();

	const goBack = () => {
		setShowSubSheet( false );
		navigation.goBack();
	};

	const openSubSheet = () => {
		navigation.navigate( BottomSheet.SubSheet.screenName );
		setShowSubSheet( true );
	};

	return (
		<BottomSheet.SubSheet
			navigationButton={
				<BottomSheet.Cell
					label={ 'Howdy' }
					separatorType="none"
					onPress={ openSubSheet }
					accessibilityRole={ 'button' }
					accessibilityLabel={ 'Howdy' }
					accessibilityHint={ 'Navigates to Howdy bottom sheet' }
				>
					<Icon icon={ chevronRight }></Icon>
				</BottomSheet.Cell>
			}
			showSheet={ showSubSheet }
		>
			<>
				<BottomSheet.NavBar>
					<BottomSheet.NavBar.BackButton onPress={ goBack } />
					<BottomSheet.NavBar.Heading>{ 'Howdy' }</BottomSheet.NavBar.Heading>
				</BottomSheet.NavBar>
				<View paddingHorizontal={ 16 }>
					<Text>{ 'World' }</Text>
				</View>
			</>
		</BottomSheet.SubSheet>
	);
};

export default ExampleControl;
```

### Props

#### showSheet

Controls the Sub Sheet content visibility.

-   Type: `Boolean`
-   Required: Yes

#### navigationButton

UI rendered to allow navigating to the Sub Sheet when tapped.

-   Type: `ReactComponent`
-   Required: Yes

#### isFullScreen

Toggles the Sub Sheet height filling the entire device height.

-   Type: `Boolean`
-   Required: Yes

See `BottomSheetSelectControl` as an example.
