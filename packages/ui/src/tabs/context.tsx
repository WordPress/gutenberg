import {
	createContext,
	useContext,
	useCallback,
	useMemo,
	useRef,
	useEffect,
} from '@wordpress/element';

type TabValue = any;

type TabsValidationContextType = {
	registerTab: ( value: TabValue ) => () => void;
	registerPanel: ( value: TabValue ) => () => void;
};

/**
 * Whether validation is enabled. This is a build-time constant that allows
 * bundlers to tree-shake all validation code in production builds.
 */
const VALIDATION_ENABLED = process.env.NODE_ENV !== 'production';

// Context is only created in development mode.
// When VALIDATION_ENABLED is true, this is guaranteed to be a valid Context.
const TabsValidationContext = VALIDATION_ENABLED
	? createContext< TabsValidationContextType | null >( null )
	: ( null as unknown as React.Context< TabsValidationContextType | null > );

/**
 * Development-only hook to access the tabs validation context.
 */
function useTabsValidationContextDev() {
	return useContext( TabsValidationContext );
}

/**
 * Production no-op hook.
 */
function useTabsValidationContextProd() {
	return null;
}

/**
 * Hook to access the tabs validation context.
 * Returns null in production or if not within a Tabs.Root.
 */
export const useTabsValidationContext = VALIDATION_ENABLED
	? useTabsValidationContextDev
	: useTabsValidationContextProd;

/**
 * Development-only hook that throws if not within Tabs.Root.
 */
function useRequireTabsRootDev( componentName: string ) {
	const context = useTabsValidationContextDev();

	if ( context === null ) {
		throw new Error(
			`\`${ componentName }\` must be used within a \`Tabs.Root\` component.`
		);
	}
}

/**
 * Production no-op hook.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useRequireTabsRootProd( componentName: string ) {
	// No-op in production
}

/**
 * Hook that throws an error in development if the component
 * is not wrapped in a Tabs.Root.
 *
 * @param componentName The name of the component (for the error message).
 */
export const useRequireTabsRoot = VALIDATION_ENABLED
	? useRequireTabsRootDev
	: useRequireTabsRootProd;

/**
 * Development-only provider that tracks registered tabs and panels,
 * and validates that they match.
 */
function TabsValidationProviderDev( {
	children,
}: {
	children: React.ReactNode;
} ) {
	const tabsRef = useRef< Set< TabValue > >( new Set() );
	const panelsRef = useRef< Set< TabValue > >( new Set() );
	const validationScheduledRef = useRef< ReturnType<
		typeof setTimeout
	> | null >( null );

	const scheduleValidation = useCallback( () => {
		// Clear any existing scheduled validation
		if ( validationScheduledRef.current ) {
			clearTimeout( validationScheduledRef.current );
		}

		// Schedule validation for the next tick to allow all registrations to complete
		validationScheduledRef.current = setTimeout( () => {
			const tabValues = tabsRef.current;
			const panelValues = panelsRef.current;

			// Find tabs without matching panels
			const tabsWithoutPanels: TabValue[] = [];
			tabValues.forEach( ( value ) => {
				if ( ! panelValues.has( value ) ) {
					tabsWithoutPanels.push( value );
				}
			} );

			// Find panels without matching tabs
			const panelsWithoutTabs: TabValue[] = [];
			panelValues.forEach( ( value ) => {
				if ( ! tabValues.has( value ) ) {
					panelsWithoutTabs.push( value );
				}
			} );

			// Warn about mismatches
			if ( tabsWithoutPanels.length > 0 ) {
				// eslint-disable-next-line no-console
				console.warn(
					`Tabs: Found Tab(s) without matching Panel(s). ` +
						`Each Tab should have a corresponding Panel with the same \`value\` prop. ` +
						`Tab value(s) without panels: ${ tabsWithoutPanels
							.map( String )
							.join( ', ' ) }`
				);
			}

			if ( panelsWithoutTabs.length > 0 ) {
				// eslint-disable-next-line no-console
				console.warn(
					`Tabs: Found Panel(s) without matching Tab(s). ` +
						`Each Panel should have a corresponding Tab with the same \`value\` prop. ` +
						`Panel value(s) without tabs: ${ panelsWithoutTabs
							.map( String )
							.join( ', ' ) }`
				);
			}

			validationScheduledRef.current = null;
		}, 0 );
	}, [] );

	const registerTab = useCallback(
		( value: TabValue ) => {
			tabsRef.current.add( value );
			scheduleValidation();

			// Return unregister function
			return () => {
				tabsRef.current.delete( value );
				scheduleValidation();
			};
		},
		[ scheduleValidation ]
	);

	const registerPanel = useCallback(
		( value: TabValue ) => {
			panelsRef.current.add( value );
			scheduleValidation();

			// Return unregister function
			return () => {
				panelsRef.current.delete( value );
				scheduleValidation();
			};
		},
		[ scheduleValidation ]
	);

	// Cleanup scheduled validation on unmount
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
 * Provider component that tracks registered tabs and panels,
 * and validates that they match in development mode.
 *
 * In production, this component is a no-op and just renders children.
 */
export const TabsValidationProvider = VALIDATION_ENABLED
	? TabsValidationProviderDev
	: TabsValidationProviderProd;
