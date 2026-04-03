import {
	createContext,
	useContext,
	useCallback,
	useMemo,
	useRef,
	useEffect,
} from '@wordpress/element';

type TabsValidationContextType = {
	registerTab: () => () => void;
	registerPanel: () => () => void;
};

/**
 * Whether validation is enabled. This is a build-time constant that allows
 * bundlers to tree-shake all validation code in production builds.
 */
const VALIDATION_ENABLED = process.env.NODE_ENV !== 'production';

const TabsValidationContext = VALIDATION_ENABLED
	? createContext< TabsValidationContextType | null >( null )
	: ( null as unknown as React.Context< TabsValidationContextType | null > );

function useRegisterTabDev() {
	const context = useContext( TabsValidationContext );

	useEffect( () => {
		if ( context ) {
			return context.registerTab();
		}
		return undefined;
	}, [ context ] );
}

function useRegisterTabProd() {
	// No-op in production.
}

/**
 * Hook that registers a Tab for count validation in development mode.
 */
export const useRegisterTab = VALIDATION_ENABLED
	? useRegisterTabDev
	: useRegisterTabProd;

function useRegisterPanelDev() {
	const context = useContext( TabsValidationContext );

	useEffect( () => {
		if ( context ) {
			return context.registerPanel();
		}
		return undefined;
	}, [ context ] );
}

function useRegisterPanelProd() {
	// No-op in production.
}

/**
 * Hook that registers a Panel for count validation in development mode.
 */
export const useRegisterPanel = VALIDATION_ENABLED
	? useRegisterPanelDev
	: useRegisterPanelProd;

/**
 * Development-only provider that tracks the number of registered tabs and
 * panels, and warns when the counts don't match.
 */
function TabsValidationProviderDev( {
	children,
}: {
	children: React.ReactNode;
} ) {
	const tabCountRef = useRef( 0 );
	const panelCountRef = useRef( 0 );
	const validationScheduledRef = useRef< ReturnType<
		typeof setTimeout
	> | null >( null );

	const scheduleValidation = useCallback( () => {
		if ( validationScheduledRef.current ) {
			clearTimeout( validationScheduledRef.current );
		}

		// Schedule validation for the next tick to allow all
		// registrations/unregistrations to complete.
		validationScheduledRef.current = setTimeout( () => {
			const tabCount = tabCountRef.current;
			const panelCount = panelCountRef.current;

			if ( tabCount !== panelCount ) {
				throw new Error(
					`Tabs: Tab/Panel count mismatch (${ tabCount } Tabs, ${ panelCount } Panels). ` +
						`Each Tab must be associated with exactly one Panel. ` +
						`Mismatched or missing associations can break screen reader navigation ` +
						`and violate WAI-ARIA Tabs pattern requirements.`
				);
			}

			validationScheduledRef.current = null;
		}, 0 );
	}, [] );

	const registerTab = useCallback( () => {
		tabCountRef.current += 1;
		scheduleValidation();

		return () => {
			tabCountRef.current -= 1;
			scheduleValidation();
		};
	}, [ scheduleValidation ] );

	const registerPanel = useCallback( () => {
		panelCountRef.current += 1;
		scheduleValidation();

		return () => {
			panelCountRef.current -= 1;
			scheduleValidation();
		};
	}, [ scheduleValidation ] );

	useEffect( () => {
		return () => {
			if ( validationScheduledRef.current ) {
				clearTimeout( validationScheduledRef.current );
			}
		};
	}, [] );

	const contextValue = useMemo(
		() => ( {
			registerTab,
			registerPanel,
		} ),
		[ registerTab, registerPanel ]
	);

	return (
		<TabsValidationContext.Provider value={ contextValue }>
			{ children }
		</TabsValidationContext.Provider>
	);
}

/**
 * Production no-op provider that just renders children.
 */
function TabsValidationProviderProd( {
	children,
}: {
	children: React.ReactNode;
} ) {
	return <>{ children }</>;
}

/**
 * Provider component that validates the number of tabs matches the number
 * of panels in development mode.
 *
 * In production, this component is a no-op and just renders children.
 */
export const TabsValidationProvider = VALIDATION_ENABLED
	? TabsValidationProviderDev
	: TabsValidationProviderProd;
