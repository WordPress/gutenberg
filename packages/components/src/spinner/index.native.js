import { View } from 'react-native';

export default function Spinner(props) {
	const {progress} = props;

	const width = progress + '%';

	return (
		<View style={{flex: 1, height:5, backgroundColor: '#a8bece'}}>
            <View style={{width: width, height:5, backgroundColor: '#0087be'}}/>
         </View>
	);
}
