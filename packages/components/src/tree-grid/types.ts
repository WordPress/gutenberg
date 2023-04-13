export type TreeGridRowProps = {
	/**
	 * The children to be rendered in the row.
	 */
	children: React.ReactNode;
	/**
	 * An integer value designating the level in the hierarchical tree structure.
	 * Counting starts at 1. A value of `1` indicates the root level of the structure.
	 */
	level: NonNullable< React.AriaAttributes[ 'aria-level' ] >;
	/**
	 * An integer value that represents the position in the set.
	 * A set is the count of elements at a specific level. Counting starts at 1.
	 */
	positionInSet: NonNullable< React.AriaAttributes[ 'aria-posinset' ] >;
	/**
	 * An integer value that represents the total number of items in the set,
	 * at this specific level of the hierarchy.
	 */
	setSize: NonNullable< React.AriaAttributes[ 'aria-setsize' ] >;
	/**
	 * An optional value that designates whether a row is expanded or collapsed.
	 * Currently this value only sets the correct aria-expanded property on a row,
	 * it has no other built-in behavior.
	 */
	isExpanded?: boolean;
};

type RovingTabIndexItemPassThruProps = {
	ref: React.ForwardedRef< any >;
	tabIndex?: number;
	onFocus: React.FocusEventHandler< any >;
	[ key: string ]: any;
};

export type RovingTabIndexItemProps = {
	/**
	 * A render function that receives the props necessary to make it participate in the
	 * roving tabindex. Any extra props will also be passed through to this function.
	 *
	 * Props passed as an argument to the render prop must be passed to the child
	 * focusable component/element within the cell. If a component is used, it must
	 * correctly handle the `onFocus`, `tabIndex`, and `ref` props, passing these to the
	 * element it renders. These props are used to handle the roving tabindex functionality
	 * of the tree grid.
	 *
	 * ```jsx
	 * <TreeGridCell>
	 * 	{ ( props ) => (
	 * 		<Button onClick={ doSomething } { ...props }>
	 * 			Do something
	 * 		</Button>
	 * 	) }
	 * </TreeGridCell>
	 * ```
	 */
	children?: ( props: RovingTabIndexItemPassThruProps ) => JSX.Element;
	/**
	 * If `children` is not a function, this component will be used instead.
	 */
	as?: React.ComponentType< RovingTabIndexItemPassThruProps >;
	[ key: string ]: any;
};

export type TreeGridCellProps =
	| ( {
			/**
			 * Render `children` without wrapping it in a `TreeGridItem` component.
			 * This means that `children` will not participate in the roving tabindex.
			 *
			 * @default false
			 */
			withoutGridItem?: false;
	  } & NonNullable< Pick< RovingTabIndexItemProps, 'children' > > )
	| {
			children: React.ReactNode;
			withoutGridItem: true;
	  };

export type TreeGridProps = {
	/**
	 * Label to use for the element with the `application` role.
	 */
	applicationAriaLabel?: string;
	/**
	 * The children to be rendered in the tree grid.
	 */
	children: React.ReactNode;
	/**
	 * Callback to fire when row is expanded.
	 *
	 * @default noop
	 */
	onExpandRow?: ( row: HTMLElement ) => void;
	/**
	 * Callback to fire when row is collapsed.
	 *
	 * @default noop
	 */
	onCollapseRow?: ( row: HTMLElement ) => void;
	/**
	 * Callback that fires when focus is shifted from one row to another via
	 * the Up and Down keys. Callback is also fired on Home and End keys which
	 * move focus from the beginning row to the end row.
	 *
	 * The callback is passed the event, the start row element that the focus was on
	 * originally, and the destination row element after the focus has moved.
	 *
	 * @default noop
	 */
	onFocusRow?: (
		event: React.KeyboardEvent< HTMLTableElement >,
		startRow: HTMLElement,
		destinationRow: HTMLElement
	) => void;
};
