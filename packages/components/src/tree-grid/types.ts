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
