import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
} from '@wordpress/element';
import { useScheduleValidation } from './use-schedule-validation';

/**
 * Whether validation is enabled. This is a build-time constant that allows
 * bundlers to tree-shake all validation code in production builds.
 */
const VALIDATION_ENABLED = process.env.NODE_ENV !== 'production';

type OverlayValidationContextType = {
	registerTitle: ( element: HTMLElement | null ) => () => void;
};

type OverlayValidationProviderProps = {
	children: React.ReactNode;
};

/**
 * Creates development-only title validation helpers for overlay primitives.
 */
export function createOverlayTitleValidation( componentName: string ) {
	const componentNameLowerCase = componentName.toLowerCase();
	const OverlayValidationContext = VALIDATION_ENABLED
		? createContext< OverlayValidationContextType | null >( null )
		: ( null as unknown as React.Context< OverlayValidationContextType | null > );

	function useValidationContextDev() {
		return useContext( OverlayValidationContext );
	}

	function useValidationContextProd() {
		return null;
	}

	const useValidationContext = VALIDATION_ENABLED
		? useValidationContextDev
		: useValidationContextProd;

	function ValidationProviderDev( {
		children,
	}: OverlayValidationProviderProps ) {
		const titleElementRef = useRef< HTMLElement | null >( null );

		const scheduleValidation = useScheduleValidation( () => {
			const titleElement = titleElementRef.current;

			if ( ! titleElement ) {
				throw new Error(
					`${ componentName }: Missing <${ componentName }.Title>. ` +
						`For accessibility, every ${ componentNameLowerCase } requires a title. ` +
						'If needed, the title can be visually hidden but must not be omitted.'
				);
			}

			const textContent = titleElement.textContent?.trim();
			if ( ! textContent ) {
				throw new Error(
					`${ componentName }: <${ componentName }.Title> cannot be empty. ` +
						`Provide meaningful text content for the ${ componentNameLowerCase } title.`
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
			<OverlayValidationContext.Provider value={ contextValue }>
				{ children }
			</OverlayValidationContext.Provider>
		);
	}

	function ValidationProviderProd( {
		children,
	}: OverlayValidationProviderProps ) {
		return <>{ children }</>;
	}

	const ValidationProvider = VALIDATION_ENABLED
		? ValidationProviderDev
		: ValidationProviderProd;

	return {
		ValidationProvider,
		useValidationContext,
	};
}
