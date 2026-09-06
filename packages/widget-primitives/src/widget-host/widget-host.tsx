import { createContext, useContext, useMemo } from '@wordpress/element';
import type {
	ComponentPropsWithoutRef,
	ComponentType,
	ReactNode,
	RefAttributes,
} from 'react';

/**
 * Host link capability: recognition of the host's own routes plus the
 * router's link primitive. The two travel together; a match is only
 * actionable with the primitive that consumes it.
 */
export interface WidgetHostLinks {
	/**
	 * Returns the in-app route for a href, path and query as the host's
	 * router takes them, or `null` when the href points outside the host's
	 * registered routes. Consumers hand the string back to `Link` without
	 * interpreting it.
	 */
	match: ( href: string ) => string | null;

	/**
	 * The host router's link primitive. Must render a real anchor and
	 * forward `ref` to it: consumers compose the link into render props,
	 * where menus and tooltips reach their anchor through the ref. A link
	 * that drops it is skipped by keyboard navigation and loses its
	 * tooltip. `path` replaces `href`; the two never coexist.
	 */
	Link: ComponentType<
		{ path: string } & Omit< ComponentPropsWithoutRef< 'a' >, 'href' > &
			RefAttributes< HTMLAnchorElement >
	>;
}

/**
 * Capabilities a host provides to the widgets it renders. Every field is
 * optional: an absent capability degrades to the host-agnostic behavior.
 */
export interface WidgetHost {
	/**
	 * In-app link materialization. Absent: links mount plain anchors.
	 */
	links?: WidgetHostLinks;
}

const WidgetHostContext = createContext< WidgetHost >( {} );

type WidgetHostProviderProps = {
	/**
	 * Capabilities to provide; merged over any inherited host value.
	 */
	value: WidgetHost;

	/**
	 * Subtree the capabilities apply to.
	 */
	children: ReactNode;
};

/**
 * Provides host capabilities to the widgets below it. Merges over the
 * inherited value, so capabilities can layer per subtree.
 *
 * @param {WidgetHostProviderProps} props Component props.
 */
export function WidgetHostProvider( {
	value,
	children,
}: WidgetHostProviderProps ): React.ReactNode {
	const inherited = useContext( WidgetHostContext );
	const merged = useMemo(
		() => ( { ...inherited, ...value } ),
		[ inherited, value ]
	);

	return (
		<WidgetHostContext.Provider value={ merged }>
			{ children }
		</WidgetHostContext.Provider>
	);
}

/**
 * Reads the host capabilities. Defaults to `{}`: consumers guard each
 * capability and fall back to host-agnostic behavior when it is absent.
 */
export function useWidgetHost(): WidgetHost {
	return useContext( WidgetHostContext );
}
