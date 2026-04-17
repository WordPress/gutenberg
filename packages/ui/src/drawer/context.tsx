import type { Drawer as _Drawer } from '@base-ui/react/drawer';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
} from '@wordpress/element';
import { useScheduleValidation } from '../utils/use-schedule-validation';

// -- Modal context ----------------------------------------------------------

const DrawerModalContext =
	createContext< _Drawer.Root.Props[ 'modal' ] >( true );

export function DrawerModalProvider( {
	modal = true,
	children,
}: {
	modal?: _Drawer.Root.Props[ 'modal' ];
	children: React.ReactNode;
} ) {
	return (
		<DrawerModalContext.Provider value={ modal }>
			{ children }
		</DrawerModalContext.Provider>
	);
}

export function useDrawerModal() {
	return useContext( DrawerModalContext );
}

// -- Validation context (dev-only) ------------------------------------------

/**
 * Whether validation is enabled. This is a build-time constant that allows
 * bundlers to tree-shake all validation code in production builds.
 */
const VALIDATION_ENABLED = process.env.NODE_ENV !== 'production';

type DrawerValidationContextType = {
	registerTitle: ( element: HTMLElement | null ) => () => void;
};

const DrawerValidationContext = VALIDATION_ENABLED
	? createContext< DrawerValidationContextType | null >( null )
	: ( null as unknown as React.Context< DrawerValidationContextType | null > );

function useDrawerValidationContextDev() {
	return useContext( DrawerValidationContext );
}

function useDrawerValidationContextProd() {
	return null;
}

/**
 * Hook to access the drawer validation context.
 * Returns null in production or if not within a Drawer.Popup.
 */
export const useDrawerValidationContext = VALIDATION_ENABLED
	? useDrawerValidationContextDev
	: useDrawerValidationContextProd;

function DrawerValidationProviderDev( {
	children,
}: {
	children: React.ReactNode;
} ) {
	const titleElementRef = useRef< HTMLElement | null >( null );
	const scheduleValidation = useScheduleValidation( () => {
		const titleElement = titleElementRef.current;

		if ( ! titleElement ) {
			throw new Error(
				'Drawer: Missing <Drawer.Title>. ' +
					'For accessibility, every drawer requires a title. ' +
					'If needed, the title can be visually hidden but must not be omitted.'
			);
		}

		const textContent = titleElement.textContent?.trim();
		if ( ! textContent ) {
			throw new Error(
				'Drawer: <Drawer.Title> cannot be empty. ' +
					'Provide meaningful text content for the drawer title.'
			);
		}
	} );

	const registerTitle = useCallback(
		( element: HTMLElement | null ) => {
			titleElementRef.current = element;
			scheduleValidation();

			return () => {
				titleElementRef.current = null;
				scheduleValidation();
			};
		},
		[ scheduleValidation ]
	);

	const contextValue = useMemo(
		() => ( { registerTitle } ),
		[ registerTitle ]
	);

	// Schedule an initial validation on mount to catch missing titles
	// (when no Title component is rendered, registerTitle is never called).
	useEffect( () => {
		scheduleValidation();
	}, [ scheduleValidation ] );

	return (
		<DrawerValidationContext.Provider value={ contextValue }>
			{ children }
		</DrawerValidationContext.Provider>
	);
}

function DrawerValidationProviderProd( {
	children,
}: {
	children: React.ReactNode;
} ) {
	return <>{ children }</>;
}

/**
 * Provider component that validates Drawer.Title presence in development mode.
 * In production, this component is a no-op and just renders children.
 */
export const DrawerValidationProvider = VALIDATION_ENABLED
	? DrawerValidationProviderDev
	: DrawerValidationProviderProd;
