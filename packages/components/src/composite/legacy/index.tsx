/**
 * Composite is a component that may contain navigable items represented by
 * CompositeItem. It's inspired by the WAI-ARIA Composite Role and implements
 * all the keyboard navigation mechanisms to ensure that there's only one
 * tab stop for the whole Composite element. This means that it can behave as
 * a roving tabindex or aria-activedescendant container.
 *
 * This file aims at providing components that are as close as possible to the
 * original `reakit`-based implementation (which was removed from the codebase),
 * although it is recommended that consumers of the package switch to the stable,
 * un-prefixed, `ariakit`-based version of `Composite`.
 *
 * @see https://ariakit.org/components/composite
 */

/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Composite as Current } from '..';
import { useInstanceId } from '@wordpress/compose';

type Orientation = 'horizontal' | 'vertical';

export interface LegacyStateOptions {
	/**
	 * ID that will serve as a base for all the items IDs.
	 */
	baseId?: string;
	/**
	 * Determines how next and previous functions will behave. If `rtl` is set
	 * to `true`, they will be inverted. This only affects the composite widget
	 * behavior. You still need to set `dir="rtl"` on HTML/CSS.
	 *
	 * @default false
	 */
	rtl?: boolean;
	/**
	 * Defines the orientation of the composite widget. If the composite has a
	 * single row or column (one-dimensional), the orientation value determines
	 * which arrow keys can be used to move focus.
	 */
	orientation?: Orientation;
	/**
	 * The current focused item `id`.
	 */
	currentId?: string;
	/**
	 * Determines how focus moves from the start and end of rows and columns.
	 *
	 * @default false
	 */
	loop?: boolean | Orientation;
	/**
	 * If enabled, moving to the next item from the last one in a row or column
	 * will focus the first item in the next row or column and vice-versa.
	 *
	 * ** Has effect only on two-dimensional composites. **
	 *
	 * @default false
	 */
	wrap?: boolean | Orientation;
	/**
	 * If enabled, moving up or down when there's no next item or the next item
	 * is disabled will shift to the item right before it.
	 *
	 * ** Has effect only on two-dimensional composites. **
	 *
	 * @default false
	 */
	shift?: boolean;
	unstable_virtual?: boolean;
}

type Component = React.FunctionComponent< any >;

type CompositeStore = ReturnType< typeof Ariakit.useCompositeStore >;
type CompositeStoreState = { store: CompositeStore };
export type CompositeState = CompositeStoreState &
	Required< Pick< LegacyStateOptions, 'baseId' > >;

// Legacy composite components can either provide state through a
// single `state` prop, or via individual props, usually through
// spreading the state generated by `useCompositeState`.
// That is, `<Composite* { ...state }>`.
export type CompositeStateProps =
	| { state: CompositeState }
	| ( CompositeState & { state?: never } );
type ComponentProps< C extends Component > = React.ComponentPropsWithRef< C >;
export type CompositeProps< C extends Component > = ComponentProps< C > &
	CompositeStateProps;
type CompositeComponent< C extends Component > = (
	props: CompositeProps< C >
) => React.ReactElement;
type CompositeComponentProps = CompositeState &
	(
		| ComponentProps< typeof Current.Group >
		| ComponentProps< typeof Current.Item >
		| ComponentProps< typeof Current.Row >
	);

function mapLegacyStatePropsToComponentProps(
	legacyProps: CompositeStateProps
): CompositeComponentProps {
	// If a `state` prop is provided, we unpack that; otherwise,
	// the necessary props are provided directly in `legacyProps`.
	if ( legacyProps.state ) {
		const { state, ...rest } = legacyProps;
		const { store, ...props } =
			mapLegacyStatePropsToComponentProps( state );
		return { ...rest, ...props, store };
	}

	return legacyProps;
}

function proxyComposite< C extends Component >(
	ProxiedComponent: C | React.ForwardRefExoticComponent< C >,
	propMap: Record< string, string > = {}
): CompositeComponent< C > {
	const displayName = ProxiedComponent.displayName;
	const Component = ( legacyProps: CompositeStateProps ) => {
		const { store, ...rest } =
			mapLegacyStatePropsToComponentProps( legacyProps );
		const props = rest as ComponentProps< C >;
		props.id = useInstanceId( store, props.baseId, props.id );

		Object.entries( propMap ).forEach( ( [ from, to ] ) => {
			if ( props.hasOwnProperty( from ) ) {
				Object.assign( props, { [ to ]: props[ from ] } );
				delete props[ from ];
			}
		} );

		delete props.baseId;

		return <ProxiedComponent { ...props } store={ store } />;
	};
	Component.displayName = displayName;
	return Component;
}

// The old `CompositeGroup` used to behave more like the current
// `CompositeRow`, but this has been split into two different
// components. We handle that difference by checking on the
// provided role, and returning the appropriate component.
const unproxiedCompositeGroup = forwardRef<
	any,
	React.ComponentPropsWithoutRef< typeof Current.Group | typeof Current.Row >
>( ( { role, ...props }, ref ) => {
	const Component = role === 'row' ? Current.Row : Current.Group;
	return <Component ref={ ref } role={ role } { ...props } />;
} );

/**
 * _Note: please use the `Composite` component instead._
 *
 * @deprecated
 */
export const Composite = proxyComposite( Current, { baseId: 'id' } );
/**
 * _Note: please use the `Composite.Group` component instead._
 *
 * @deprecated
 */
export const CompositeGroup = proxyComposite( unproxiedCompositeGroup );
/**
 * _Note: please use the `Composite.Item` component instead._
 *
 * @deprecated
 */
export const CompositeItem = proxyComposite( Current.Item, {
	focusable: 'accessibleWhenDisabled',
} );

/**
 * _Note: please use the `Composite` component instead._
 *
 * @deprecated
 */
export function useCompositeState(
	legacyStateOptions: LegacyStateOptions = {}
): CompositeState {
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
	} = legacyStateOptions;

	return {
		baseId: useInstanceId( Composite, 'composite', baseId ),
		store: Ariakit.useCompositeStore( {
			defaultActiveId,
			rtl,
			orientation,
			focusLoop,
			focusShift,
			focusWrap,
			virtualFocus,
		} ),
	};
}
