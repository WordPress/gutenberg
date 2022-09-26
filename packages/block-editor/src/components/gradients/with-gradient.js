/**
 * Internal dependencies
 */
import { __experimentalUseGradient } from './use-gradient';

export const withGradient = ( WrappedComponent ) => ( props ) => {
	const { gradientValue } = __experimentalUseGradient();
	return <WrappedComponent { ...props } gradientValue={ gradientValue } />;
};
