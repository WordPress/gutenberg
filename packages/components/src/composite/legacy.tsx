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
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import * as Current from './v2';

type CompositeStore = ReturnType< typeof Current.useCompositeStore >;
type CompositeStoreProps = NonNullable<
	Parameters< typeof Current.useCompositeStore >[ 0 ]
>;

type Orientation = 'horizontal' | 'vertical';

interface IdState {
	baseId: string;
	setBaseId: React.Dispatch< React.SetStateAction< IdState[ 'baseId' ] > >;
}

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

export interface CompositeState {
	store: CompositeStore;

	up: () => void;
	down: () => void;
	first: () => void;
	last: () => void;
	previous: () => void;
	next: () => void;
	move: ( id: string | undefined ) => void;

	baseId: IdState[ 'baseId' ];
	setBaseId: ( v: CompositeState[ 'baseId' ] ) => void;
	currentId: string | undefined;
	setCurrentId: ( v: CompositeState[ 'currentId' ] ) => void;
	orientation: Orientation | undefined;
	setOrientation: ( v: CompositeState[ 'orientation' ] ) => void;
	rtl: boolean;
	setRTL: ( v: CompositeState[ 'rtl' ] ) => void;
	loop: boolean | Orientation;
	setLoop: ( v: CompositeState[ 'loop' ] ) => void;
	shift: boolean;
	setShift: ( v: CompositeState[ 'shift' ] ) => void;
	wrap: boolean | Orientation;
	setWrap: ( v: CompositeState[ 'wrap' ] ) => void;
}

type FilteredCompositeStateProps = Pick< CompositeState, 'store' | 'baseId' >;

type PartialCompositeState = Partial<
	Omit< CompositeState, keyof FilteredCompositeStateProps >
> &
	FilteredCompositeStateProps;

export type CompositeStateProps =
	| { state: PartialCompositeState }
	| ( PartialCompositeState & { state?: never } );

interface IdState {
	baseId: string;
	setBaseId: React.Dispatch< React.SetStateAction< string > >;
}

function showDeprecationMessage( ...props: Parameters< typeof deprecated > ) {
	if ( 'test' !== process.env.NODE_ENV ) {
		deprecated( ...props );
	}
}

const idMap = new Map< string, React.MutableRefObject< number > >();

function useBaseId(
	initialState: Pick< Partial< IdState >, 'baseId' > = {}
): IdState {
	const defaultId = useGeneratedId();
	const { baseId: initialBaseId } = initialState;
	const [ baseId, setBaseId ] = useState( initialBaseId || defaultId );
	idMap.set( baseId, useRef( 0 ) );
	return { baseId, setBaseId };
}

function useId( baseId: string, preferredId?: string ) {
	const counter = idMap.get( baseId ) ?? { current: 0 };

	const [ id, setId ] = useState( () => {
		if ( preferredId ) return preferredId;
		return `${ baseId }-${ ++counter.current }`;
	} );

	return { id, setId };
}

function useMapInitialStateToStoreProps(
	initialState: InitialState = {}
): CompositeStoreProps & IdState {
	const {
		currentId: defaultActiveId,
		orientation,
		rtl = false,
		loop: focusLoop = false,
		wrap: focusWrap = false,
		shift: focusShift = false,
		// eslint-disable-next-line camelcase
		unstable_virtual: virtualFocus,
		...idState
	} = initialState;

	return {
		...useBaseId( idState ),
		defaultActiveId,
		rtl,
		orientation,
		focusLoop,
		focusShift,
		focusWrap,
		virtualFocus,

		// TODO?
		includesBaseElement: false,
	};
}

function useCreateStoreFromInitialState(
	initialState: InitialState = {}
): FilteredCompositeStateProps & IdState {
	const { baseId, setBaseId, ...storeProps } =
		useMapInitialStateToStoreProps( initialState );
	const store = Current.useCompositeStore( storeProps );
	return { store, baseId, setBaseId };
}

function useStateBuilder<
	Store extends CompositeStore,
	Config extends Record< Key, Value >,
	Key extends Parameters< Store[ 'setState' ] >[ 0 ],
	Value extends [ string, string ],
>( store: Store, config: Partial< Config > ) {
	const meta = {} as Record< string, any >;
	for ( const [ key, [ get, set ] ] of Object.entries< Value >(
		config as Config
	) ) {
		meta[ get ] = store.useState( key as Key );
		meta[ set ] = (
			value: Parameters< typeof store.setState< Key > >[ 1 ]
		) => {
			store.setState< Key >( key as Key, value );
		};
	}
	return meta;
}

function useCreateStateFromStore( {
	store,
	baseId,
	setBaseId,
}: FilteredCompositeStateProps & IdState ): CompositeState {
	const state = useStateBuilder( store, {
		activeId: [ 'currentId', 'setCurrentId' ],
		orientation: [ 'orientation', 'setOrientation' ],
		rtl: [ 'rtl', 'setRTL' ],
		focusLoop: [ 'loop', 'setLoop' ],
		focusShift: [ 'shift', 'setShift' ],
		focusWrap: [ 'wrap', 'setWrap' ],
	} );

	return useMemo(
		() =>
			( {
				up: () => store.move( store.up() ),
				down: () => store.move( store.down() ),
				first: () => store.move( store.first() ),
				last: () => store.move( store.last() ),
				previous: () => store.move( store.previous() ),
				next: () => store.move( store.next() ),
				move: ( id: Parameters< CompositeStore[ 'move' ] >[ 0 ] ) =>
					store.move( id ),
				...state,
				baseId,
				setBaseId,
				store,
			} ) as CompositeState,
		[ baseId, setBaseId, state, store ]
	);
}

function filterProps(
	props: CompositeStateProps
): FilteredCompositeStateProps {
	if ( props.state ) {
		const { state, ...rest } = props;
		return { ...filterProps( state ), ...rest };
	}

	const {
		up,
		down,
		first,
		last,
		previous,
		next,
		move,

		setBaseId,
		currentId,
		setCurrentId,
		orientation,
		setOrientation,
		rtl,
		setRTL,
		loop,
		setLoop,
		shift,
		setShift,
		wrap,
		setWrap,

		state,

		...rest
	} = props;

	return rest;
}

function proxyComposite< T extends ( ...any: any[] ) => any >(
	LegacyComponent: T | ( ( ...args: any[] ) => T ),
	propMap: Record< PropertyKey, PropertyKey | null > = {}
): (
	props: CompositeStateProps & Record< PropertyKey, any >
) => React.ReactElement {
	return ( originalProps ) => {
		const componentName =
			// @ts-ignore
			LegacyComponent.displayName ?? LegacyComponent.render.name;

		showDeprecationMessage( componentName, {
			alternative: `@wordpress/components:${ componentName }`,
		} );

		const { store, ...rest } = filterProps( originalProps );
		const props = rest as Record< PropertyKey, any >;
		const { baseId } = props;

		Object.entries( propMap ).forEach( ( [ from, to ] ) => {
			if ( props.hasOwnProperty( from ) ) {
				if ( to ) props[ to ] = props[ from ];
				delete props[ from ];
			}
		} );

		props.id = useId( baseId, props.id ).id;
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

export const useCompositeState = ( initialState?: InitialState ) =>
	useCreateStateFromStore( useCreateStoreFromInitialState( initialState ) );
