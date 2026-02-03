/**
 * WordPress dependencies
 */
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

// Only create the context in development mode
const TabsValidationContext = VALIDATION_ENABLED
	? createContext< TabsValidationContextType | null >( null )
	: null;

/**
 * Hook to access the tabs validation context.
 * Returns null in production or if not within a Tabs.Root.
 */
export function useTabsValidationContext() {
	// This condition uses a build-time constant, so the else branch
	// is completely removed in production builds via dead code elimination.
	// eslint-disable-next-line react-hooks/rules-of-hooks -- build-time conditional
	return VALIDATION_ENABLED ? useContext( TabsValidationContext! ) : null;
}

/**
 * Hook that throws an error in development if the component
 * is not wrapped in a Tabs.Root.
 *
 * @param componentName The name of the component (for the error message).
 */
export function useRequireTabsRoot( componentName: string ) {
	const context = useTabsValidationContext();

	if ( VALIDATION_ENABLED && context === null ) {
		throw new Error(
			`\`${ componentName }\` must be used within a \`Tabs.Root\` component.`
		);
	}
}

/**
 * Provider component that tracks registered tabs and panels,
 * and validates that they match in development mode.
 *
 * In production, this component is a no-op and just renders children.
 */
export function TabsValidationProvider( {
	children,
}: {
	children: React.ReactNode;
} ) {
	// This condition uses a build-time constant, so all validation logic
	// is completely removed in production builds via dead code elimination.
	if ( ! VALIDATION_ENABLED ) {
		return children;
	}

	/* eslint-disable react-hooks/rules-of-hooks -- build-time conditional above ensures consistent hook calls */
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
							.map( ( v ) => JSON.stringify( v ) )
							.join( ', ' ) }`
				);
			}

			if ( panelsWithoutTabs.length > 0 ) {
				// eslint-disable-next-line no-console
				console.warn(
					`Tabs: Found Panel(s) without matching Tab(s). ` +
						`Each Panel should have a corresponding Tab with the same \`value\` prop. ` +
						`Panel value(s) without tabs: ${ panelsWithoutTabs
							.map( ( v ) => JSON.stringify( v ) )
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
	/* eslint-enable react-hooks/rules-of-hooks */

	return (
		<TabsValidationContext.Provider value={ contextValue }>
			{ children }
		</TabsValidationContext.Provider>
	);
}
