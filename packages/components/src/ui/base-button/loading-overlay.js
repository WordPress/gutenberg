/**
 * Internal dependencies
 */
import { Flex } from '../flex';
import { Spinner } from '../spinner';
import * as styles from './styles';

export function LoadingOverlay( { isLoading = false } ) {
	if ( ! isLoading ) return null;

	return (
		<Flex
			aria-hidden="true"
			className={ styles.LoadingOverlay }
			justify="center"
		>
			<Spinner />
		</Flex>
	);
}

export default LoadingOverlay;
