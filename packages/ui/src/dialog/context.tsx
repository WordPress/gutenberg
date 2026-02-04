import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
} from '@wordpress/element';

/**
 * Whether validation is enabled. This is a build-time constant that allows
 * bundlers to tree-shake all validation code in production builds.
 */
const VALIDATION_ENABLED = process.env.NODE_ENV !== 'production';

type DialogValidationContextType = {
	registerTitle: () => void;
};

// Context is only created in development mode.
const DialogValidationContext = VALIDATION_ENABLED
	? createContext< DialogValidationContextType | null >( null )
	: ( null as unknown as React.Context< DialogValidationContextType | null > );

/**
 * Development-only hook to access the dialog validation context.
 */
function useDialogValidationContextDev() {
	return useContext( DialogValidationContext );
}

/**
 * Production no-op hook.
 */
function useDialogValidationContextProd() {
	return null;
}

/**
 * Hook to access the dialog validation context.
 * Returns null in production or if not within a Dialog.Popup.
 */
export const useDialogValidationContext = VALIDATION_ENABLED
	? useDialogValidationContextDev
	: useDialogValidationContextProd;

/**
 * Development-only provider that tracks whether Dialog.Title is rendered.
 */
function DialogValidationProviderDev( {
	children,
}: {
	children: React.ReactNode;
} ) {
	const titleRegisteredRef = useRef( false );

	const registerTitle = useCallback( () => {
		titleRegisteredRef.current = true;
	}, [] );

	const contextValue = useMemo(
		() => ( { registerTitle } ),
		[ registerTitle ]
	);

	// Validate that Dialog.Title is rendered
	useEffect( () => {
		// useLayoutEffect in Title runs before this useEffect,
		// so titleRegisteredRef should already be set if Title is present
		if ( ! titleRegisteredRef.current ) {
			throw new Error(
				'Dialog: Missing <Dialog.Title>. ' +
					'For accessibility, every dialog requires a title. ' +
					'If needed, the title can be visually hidden but must not be omitted.'
			);
		}
	}, [] );

	return (
		<DialogValidationContext.Provider value={ contextValue }>
			{ children }
		</DialogValidationContext.Provider>
	);
}

/**
 * Production no-op provider that just renders children.
 */
function DialogValidationProviderProd( {
	children,
}: {
	children: React.ReactNode;
} ) {
	return <>{ children }</>;
}

/**
 * Provider component that validates Dialog.Title presence in development mode.
 * In production, this component is a no-op and just renders children.
 */
export const DialogValidationProvider = VALIDATION_ENABLED
	? DialogValidationProviderDev
	: DialogValidationProviderProd;
