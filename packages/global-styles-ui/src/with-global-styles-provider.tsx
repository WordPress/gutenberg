/**
 * WordPress dependencies
 */
import type { GlobalStylesConfig } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { GlobalStylesProvider } from './provider';

interface GlobalStylesProviderProps {
	value: GlobalStylesConfig;
	baseValue: GlobalStylesConfig;
	onChange: ( config: GlobalStylesConfig ) => void;
}

/**
 * Higher-order component that wraps a component with GlobalStylesProvider.
 * This allows components to access GlobalStylesContext without exposing
 * the provider directly in the public API.
 *
 * @param Component - The component to wrap
 * @return A wrapped component that accepts value, baseValue, and onChange props
 */
export function withGlobalStylesProvider< P extends object >(
	Component: React.ComponentType< P >
) {
	return function WrappedComponent( {
		value,
		baseValue,
		onChange,
		...props
	}: P & GlobalStylesProviderProps ) {
		return (
			<GlobalStylesProvider
				value={ value }
				baseValue={ baseValue }
				onChange={ onChange }
			>
				<Component { ...( props as P ) } />
			</GlobalStylesProvider>
		);
	};
}
