/**
 * External dependencies
 */
import type {
	ComponentType,
	FunctionComponent,
	PropsWithChildren,
} from 'react';
import type { Subtract } from 'utility-types';

/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useReducer,
} from '@wordpress/element';
import { defaultI18n } from '@wordpress/i18n';
import type { I18n } from '@wordpress/i18n';
interface I18nContextProps {
	__: I18n[ '__' ];
	_x: I18n[ '_x' ];
	_n: I18n[ '_n' ];
	_nx: I18n[ '_nx' ];
	isRTL: I18n[ 'isRTL' ];
	hasTranslation: I18n[ 'hasTranslation' ];
}

/**
 * Utility to make a new context value
 *
 * @param  i18n
 */
function makeContextValue( i18n: I18n ): I18nContextProps {
	return {
		__: i18n.__.bind( i18n ),
		_x: i18n._x.bind( i18n ),
		_n: i18n._n.bind( i18n ),
		_nx: i18n._nx.bind( i18n ),
		isRTL: i18n.isRTL.bind( i18n ),
		hasTranslation: i18n.hasTranslation.bind( i18n ),
	};
}

const I18nContext = createContext( makeContextValue( defaultI18n ) );

type I18nProviderProps = PropsWithChildren< { i18n: I18n } >;

/**
 * The `I18nProvider` should be mounted above any localized components:
 *
 * @example
 * ```js
 * import { createI18n } from '@wordpress/react-i18n';
 * import { I18nProvider } from '@wordpress/react-i18n';
 * const i18n = createI18n();
 *
 * ReactDom.render(
 * 	<I18nProvider i18n={ i18n }>
 * 		<App />
 * 	</I18nProvider>,
 * 	el
 * );
 * ```
 *
 * You can also instantiate the provider without the `i18n` prop. In that case it will use the
 * default `I18n` instance exported from `@wordpress/i18n`.
 *
 * @param  props i18n provider props.
 * @return Children wrapped in the I18nProvider.
 */
export function I18nProvider( props: I18nProviderProps ): JSX.Element {
	const { children, i18n = defaultI18n } = props;
	const [ update, forceUpdate ] = useReducer( () => [], [] );

	// rerender translations whenever the i18n instance fires a change event
	useEffect( () => i18n.subscribe( forceUpdate ), [ i18n ] );

	const value = useMemo( () => makeContextValue( i18n ), [ i18n, update ] );

	return (
		<I18nContext.Provider value={ value }>
			{ children }
		</I18nContext.Provider>
	);
}

/**
 * React hook providing access to i18n functions. It exposes the `__`, `_x`, `_n`, `_nx`,
 * `isRTL` and `hasTranslation` functions from [`@wordpress/i18n`](../i18n).
 * Refer to their documentation there.
 *
 * @example
 * ```js
 * import { useI18n } from '@wordpress/react-i18n';
 *
 * function MyComponent() {
 * 	const { __ } = useI18n();
 * 	return __( 'Hello, world!' );
 * }
 * ```
 */
export const useI18n = () => useContext( I18nContext );

type PropsAndI18n< P > = Pick<
	P,
	Exclude< keyof P, '__' | '_x' | '_n' | '_nx' | 'isRTL' | 'hasTranslation' >
>;

/**
 * React higher-order component that passes the i18n translate functions (the same set
 * as exposed by the `useI18n` hook) to the wrapped component as props.
 *
 * @example
 * ```js
 * import { withI18n } from '@wordpress/react-i18n';
 *
 * function MyComponent( { __ } ) {
 * 	return __( 'Hello, world!' );
 * }
 *
 * export default withI18n( MyComponent );
 * ```
 *
 * @param  InnerComponent React component to be wrapped and receive the i18n functions like `__`
 * @return The wrapped component
 */
export function withI18n< P extends I18nContextProps >(
	InnerComponent: ComponentType< P >
): FunctionComponent< PropsAndI18n< P > > {
	const EnhancedComponent: ComponentType<
		Subtract< P, I18nContextProps >
	> = ( props ) => {
		const i18nProps = useI18n();
		return <InnerComponent { ...( props as P ) } { ...i18nProps } />;
	};
	const innerComponentName =
		InnerComponent.displayName || InnerComponent.name || 'Component';
	EnhancedComponent.displayName = `WithI18n(${ innerComponentName })`;
	return EnhancedComponent;
}
