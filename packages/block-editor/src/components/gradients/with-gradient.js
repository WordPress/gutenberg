/**
 * Internal dependencies
 */
import { useGradient } from './use-gradient';

export const withGradient = ( WrappedComponent ) =>
	function WithGradient( props ) {
		const { gradientValue } = useGradient();
		return (
			<WrappedComponent { ...props } gradientValue={ gradientValue } />
		);
	};
