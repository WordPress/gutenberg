import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
} from '@wordpress/element';
import type { ReactNode } from 'react';
import { useScheduleValidation } from '../utils/use-schedule-validation';

const VALIDATION_ENABLED = process.env.NODE_ENV !== 'production';

function warn( message: string ) {
	// NavigationMenu authoring validation is intentionally non-fatal.
	// eslint-disable-next-line no-console
	console.warn( `NavigationMenu: ${ message }` );
}

type NavigationMenuContextValue = {
	depth: number;
	orientation: 'horizontal' | 'vertical';
	registerActiveLink: ( id: object, active: boolean ) => () => void;
	registerItemValue: ( value: unknown ) => () => void;
};

const NavigationMenuContext =
	createContext< NavigationMenuContextValue | null >( null );

export function useNavigationMenuContext() {
	const context = useContext( NavigationMenuContext );

	if ( ! context ) {
		throw new Error(
			'NavigationMenu: Component must be rendered within NavigationMenu.Root.'
		);
	}

	return context;
}

export function NavigationMenuContextProvider( {
	children,
	isNamed,
	orientation,
}: {
	children: ReactNode;
	isNamed: boolean;
	orientation: 'horizontal' | 'vertical';
} ) {
	const parentContext = useContext( NavigationMenuContext );
	const depth = parentContext ? parentContext.depth + 1 : 0;
	const activeLinksRef = useRef( new Set< object >() );
	const itemValuesRef = useRef( new Map< unknown, number >() );
	const scheduleValidation = useScheduleValidation( () => {
		if ( depth === 0 && ! isNamed ) {
			warn(
				'Outer Root requires an accessible name through aria-label or aria-labelledby.'
			);
		}

		if ( activeLinksRef.current.size > 1 ) {
			warn( 'Only one Link in the same Root should be active.' );
		}

		if (
			Array.from( itemValuesRef.current.values() ).some(
				( count ) => count > 1
			)
		) {
			warn( 'Item values must be unique within the same Root.' );
		}
	} );

	const registerActiveLink = useCallback(
		( id: object, active: boolean ) => {
			if ( ! VALIDATION_ENABLED || ! active ) {
				return () => {};
			}

			activeLinksRef.current.add( id );
			scheduleValidation();

			return () => {
				activeLinksRef.current.delete( id );
				scheduleValidation();
			};
		},
		[ scheduleValidation ]
	);

	const registerItemValue = useCallback(
		( value: unknown ) => {
			if ( ! VALIDATION_ENABLED || value === undefined ) {
				return () => {};
			}

			itemValuesRef.current.set(
				value,
				( itemValuesRef.current.get( value ) ?? 0 ) + 1
			);
			scheduleValidation();

			return () => {
				const nextCount =
					( itemValuesRef.current.get( value ) ?? 1 ) - 1;
				if ( nextCount === 0 ) {
					itemValuesRef.current.delete( value );
				} else {
					itemValuesRef.current.set( value, nextCount );
				}
				scheduleValidation();
			};
		},
		[ scheduleValidation ]
	);

	useEffect( () => {
		if ( VALIDATION_ENABLED ) {
			scheduleValidation();
		}
	}, [ isNamed, scheduleValidation ] );

	const contextValue = useMemo(
		() => ( {
			depth,
			orientation,
			registerActiveLink,
			registerItemValue,
		} ),
		[ depth, orientation, registerActiveLink, registerItemValue ]
	);

	return (
		<NavigationMenuContext.Provider value={ contextValue }>
			{ children }
		</NavigationMenuContext.Provider>
	);
}

type ItemValidationContextValue = {
	registerContent: () => () => void;
	registerTrigger: () => () => void;
};

const ItemValidationContext =
	createContext< ItemValidationContextValue | null >( null );

export function useItemValidationContext() {
	return useContext( ItemValidationContext );
}

export function ItemValidationProvider( {
	children,
	value,
}: {
	children: ReactNode;
	value: unknown;
} ) {
	const { registerItemValue } = useNavigationMenuContext();
	const triggerCountRef = useRef( 0 );
	const contentCountRef = useRef( 0 );
	const scheduleValidation = useScheduleValidation( () => {
		if ( triggerCountRef.current > 0 && contentCountRef.current === 0 ) {
			warn( 'Trigger requires corresponding Content in the same Item.' );
		}
		if ( contentCountRef.current > 0 && triggerCountRef.current === 0 ) {
			warn( 'Content requires corresponding Trigger in the same Item.' );
		}
	} );

	const registerPart = useCallback(
		( part: 'content' | 'trigger' ) => {
			if ( ! VALIDATION_ENABLED ) {
				return () => {};
			}

			const countRef =
				part === 'trigger' ? triggerCountRef : contentCountRef;
			countRef.current += 1;
			scheduleValidation();

			return () => {
				countRef.current -= 1;
				scheduleValidation();
			};
		},
		[ scheduleValidation ]
	);

	useEffect( () => registerItemValue( value ), [ registerItemValue, value ] );
	useEffect( () => {
		if ( VALIDATION_ENABLED ) {
			scheduleValidation();
		}
	}, [ scheduleValidation ] );

	const contextValue = useMemo(
		() => ( {
			registerContent: () => registerPart( 'content' ),
			registerTrigger: () => registerPart( 'trigger' ),
		} ),
		[ registerPart ]
	);

	return (
		<ItemValidationContext.Provider value={ contextValue }>
			{ children }
		</ItemValidationContext.Provider>
	);
}
