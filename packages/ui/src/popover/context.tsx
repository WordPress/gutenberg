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

type PopoverValidationContextType = {
	registerTitle: ( element: HTMLElement | null ) => void;
};

const PopoverValidationContext = VALIDATION_ENABLED
	? createContext< PopoverValidationContextType | null >( null )
	: ( null as unknown as React.Context< PopoverValidationContextType | null > );

function usePopoverValidationContextDev() {
	return useContext( PopoverValidationContext );
}

function usePopoverValidationContextProd() {
	return null;
}

/**
 * Hook to access the popover validation context.
 * Returns null in production or if not within a Popover.Popup.
 */
export const usePopoverValidationContext = VALIDATION_ENABLED
	? usePopoverValidationContextDev
	: usePopoverValidationContextProd;

/**
 * Development-only provider that tracks whether Popover.Title is rendered.
 */
function PopoverValidationProviderDev( {
	children,
}: {
	children: React.ReactNode;
} ) {
	const titleElementRef = useRef< HTMLElement | null >( null );

	const registerTitle = useCallback( ( element: HTMLElement | null ) => {
		titleElementRef.current = element;
	}, [] );

	const contextValue = useMemo(
		() => ( { registerTitle } ),
		[ registerTitle ]
	);

	useEffect( () => {
		const titleElement = titleElementRef.current;

		if ( ! titleElement ) {
			throw new Error(
				'Popover: Missing <Popover.Title>. ' +
					'For accessibility, every popover requires a title. ' +
					'If needed, the title can be visually hidden but must not be omitted.'
			);
		}

		const textContent = titleElement.textContent?.trim();
		if ( ! textContent ) {
			throw new Error(
				'Popover: <Popover.Title> cannot be empty. ' +
					'Provide meaningful text content for the popover title.'
			);
		}
	}, [] );

	return (
		<PopoverValidationContext.Provider value={ contextValue }>
			{ children }
		</PopoverValidationContext.Provider>
	);
}

function PopoverValidationProviderProd( {
	children,
}: {
	children: React.ReactNode;
} ) {
	return <>{ children }</>;
}

/**
 * Provider component that validates Popover.Title presence in development mode.
 * In production, this component is a no-op and just renders children.
 */
export const PopoverValidationProvider = VALIDATION_ENABLED
	? PopoverValidationProviderDev
	: PopoverValidationProviderProd;
