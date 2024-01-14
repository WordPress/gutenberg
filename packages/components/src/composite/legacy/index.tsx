/**
 * Composite is a component that may contain navigable items represented by
 * CompositeItem. It's inspired by the WAI-ARIA Composite Role and implements
 * all the keyboard navigation mechanisms to ensure that there's only one
 * tab stop for the whole Composite element. This means that it can behave as
 * a roving tabindex or aria-activedescendant container.
 *
 * @see https://ariakit.org/components/composite
 */

/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useId as useGeneratedId,
	useRef,
	useState,
} from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import * as Current from '../current';

type Component = ( ...any: any[] ) => any;

type CompositeStore = ReturnType< typeof Current.useCompositeStore >;
type CompositeStoreState = { store: CompositeStore };
type CompositeStoreProps = NonNullable<
	Parameters< typeof Current.useCompositeStore >[ 0 ]
>;

type Orientation = 'horizontal' | 'vertical';

export interface InitialState {
	baseId?: string;
	unstable_virtual?: boolean;
	rtl?: boolean;
	orientation?: Orientation;
	currentId?: string;
	loop?: boolean | Orientation;
	wrap?: boolean | Orientation;
	shift?: boolean;
}

type BaseIdState = Required< Pick< InitialState, 'baseId' > >;
type BaseId = BaseIdState[ 'baseId' ];
type MappedInitialState = CompositeStoreProps & BaseIdState;

export type CompositeState = CompositeStoreState & BaseIdState;
export type CompositeStateProps =
	| { state: CompositeState }
	| ( CompositeState & { state?: never } );
export type CompositeProps< C extends Component > = CompositeStateProps &
	React.ComponentProps< C >;

type ManagedProps = CompositeStoreState & {
	props: Record< PropertyKey, any >;
};

const idMap = new Map< BaseId, React.MutableRefObject< number > >();

function useBaseId( preferredBaseId?: BaseId ): BaseId {
	const generatedId = useGeneratedId();
	const [ baseId ] = useState( preferredBaseId || generatedId );
	idMap.set( baseId, useRef( 0 ) );

	return baseId;
}

function useId( baseId: BaseId, preferredId?: string ) {
	const counter = idMap.get( baseId ) ?? { current: 0 };
	const [ id ] = useState( () => {
		if ( preferredId ) return preferredId;
		return `${ baseId }-${ ++counter.current }`;
	} );

	return id;
}

function useMappedInitialState(
	initialState: InitialState = {}
): MappedInitialState {
	const {
		baseId,
		currentId: defaultActiveId,
		orientation,
		rtl = false,
		loop: focusLoop = false,
		wrap: focusWrap = false,
		shift: focusShift = false,
		// eslint-disable-next-line camelcase
		unstable_virtual: virtualFocus,
	} = initialState;

	return {
		baseId: useBaseId( baseId ),
		defaultActiveId,
		rtl,
		orientation,
		focusLoop,
		focusShift,
		focusWrap,
		virtualFocus,
	};
}

function manageProps( stateProps: CompositeStateProps ): ManagedProps {
	if ( stateProps.state ) {
		const { state, ...rest } = stateProps;
		const { store, props } = manageProps( state );
		return { store, props: { ...rest, ...props } };
	}

	const { store, ...props } = stateProps;
	return { store, props };
}

function proxyComposite< C extends Component >(
	LegacyComponent: C | ( ( ...args: any[] ) => C ),
	propMap: Record< PropertyKey, PropertyKey | null > = {}
): ( props: CompositeProps< C > ) => React.ReactElement {
	return ( unmanagedProps ) => {
		const componentName =
			// @ts-ignore
			LegacyComponent.displayName ?? LegacyComponent.render.name;

		deprecated( `wp.components.__unstable${ componentName }`, {
			alternative: `wp.components.${ componentName }`,
		} );

		const { store, props } = manageProps( unmanagedProps );

		Object.entries( propMap ).forEach( ( [ from, to ] ) => {
			if ( props.hasOwnProperty( from ) ) {
				if ( to ) props[ to ] = props[ from ];
				delete props[ from ];
			}
		} );

		props.id = useId( props.baseId, props.id );
		delete props.baseId;

		return <LegacyComponent { ...props } store={ store } />;
	};
}

export const Composite = proxyComposite( Current.Composite, { baseId: 'id' } );

export const CompositeGroup = proxyComposite(
	forwardRef( function CompositeGroup( { role, ...props }, ref ) {
		const Component =
			role === 'row' ? Current.CompositeRow : Current.CompositeGroup;
		return <Component ref={ ref } role={ role } { ...props } />;
	} )
);

export const CompositeItem = proxyComposite( Current.CompositeItem, {
	focusable: 'accessibleWhenDisabled',
} );

export function useCompositeState( initialState: InitialState = {} ) {
	deprecated( 'wp.components.__unstableUseCompositeState', {
		alternative: 'wp.components.useCompositeStore',
	} );
	const { baseId, ...storeProps } = useMappedInitialState( initialState );
	const store = Current.useCompositeStore( storeProps );
	return { store, baseId };
}
