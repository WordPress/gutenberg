export type TreeGridRowProps = {
	children: React.ReactNode;
	/**
	 * An integer value designating the level in the hierarchical tree structure.
	 * Counting starts at 1. A value of `1` indicates the root level of the structure.
	 */
	level: React.AriaAttributes[ 'aria-level' ];
	/**
	 * An integer value that represents the position in the set.
	 * A set is the count of elements at a specific level. Counting starts at 1.
	 */
	positionInSet: React.AriaAttributes[ 'aria-posinset' ];
	/**
	 * An integer value that represents the total number of items in the set,
	 * at this specific level of the hierarchy.
	 */
	setSize: React.AriaAttributes[ 'aria-setsize' ];
	/**
	 * An optional value that designates whether a row is expanded or collapsed.
	 * Currently this value only sets the correct aria-expanded property on a row,
	 * it has no other built-in behavior.
	 */
	isExpanded?: React.AriaAttributes[ 'aria-expanded' ];
};

type RovingTabIndexItemPassThruProps = {
	ref: React.ForwardedRef< any >;
	tabIndex?: number;
	onFocus: React.FocusEventHandler< any >;
} & Record< string, any >;

export type RovingTabIndexItemProps = {
	/**
	 * A component that will receive the props necessary to
	 * make it roving tab index compliant. All props will be passed through
	 * to this component.
	 */
	children?: ( props: RovingTabIndexItemPassThruProps ) => JSX.Element;
	/**
	 * If `children` is not a function, this component will be used instead.
	 */
	as?: React.ComponentType< RovingTabIndexItemPassThruProps >;
} & Record< string, any >;
