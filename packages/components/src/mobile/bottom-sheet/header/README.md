# Header

Header components is meant to be used to compose the header inside the BottomSheet.

### Usage
See 
```jsx
/**
 * External dependencies
 */
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { BottomSheet } from '@wordpress/components';

const ExampleControl = () => {

    const goBack = () => {};
    const applySettings = () => {};

	return (
		<BottomSheet.SubSheet>
			<>
				<BottomSheet.Header>
					<BottomSheet.Header.BackButton onPress={ goBack } />
					<BottomSheet.Header.Title>{ 'Howdy' }</BottomSheet.Header.Title>
                    <BottomSheet.Header.ApplyButton onPress={ applySetting } />
				</BottomSheet.Header>
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
Header component doesn't have any props. 

### Other Components
Other components that Header component makes available. 

#### ApplyButton 
```
<Header.ApplyButton onPress={ goBack } />
```

The apply button is used to apply settings of the bottom sheet control.

##### onPress 
use to pass a call back once the ApplyButton is clicked. 

#### BackButton 
```
<Header.BackButton onPress={ goBack } />
```

The back button is used to send the user back to the previous sheet. 

##### onPress 
use to pass a call back once the BackButton is clicked. 

#### CancelButton 
```
<Header.CancelButton onPress={ goBack } />
```

The cancel button is used to send the user back to the previous sheet. Closes the sheet. Use this if you are using a full screen bottom sheet. 

##### onPress 
use to pass a call back once the CancelButton is clicked. 

#### CloseButton 
```
<Header.CloseButton onPress={ goBack } />
```

The close button is used to closes the bottom sheet. Use this if you are using a full screen bottom sheet. 

#### Title 
```
<Header.Title>{ 'Howdy' }</Header.Title>
```

The title is used to display the title of the bottom sheet control.
