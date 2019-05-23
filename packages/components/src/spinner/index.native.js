/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import style from './style.scss';

export default function Spinner( props 	) {
	const { progress } = props;

	const width = progress + '%';

	return (
		<View style={ [ style.spinner, { width } ] } />
	);
}
