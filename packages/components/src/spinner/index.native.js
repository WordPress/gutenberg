import { View } from 'react-native';

export default function Spinner( props 	) {
	const { progress } = props;

	const width = progress + '%';

	return (
		<View style={ { flex: 1, height: 5, backgroundColor: '#c8d7e1' } }>
			<View style={ { width, height: 5, backgroundColor: '#0087be' } } />
		</View>
	);
}
