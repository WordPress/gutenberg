/**
 * Represents a single change in history.
 */
export interface HistoryChange< From = unknown, To = From > {
	/** The previous value */
	from: From;
	/** The new value */
	to: To;
}

/**
 * Represents changes for a single item.
 */
export interface HistoryChanges< T = unknown > {
	/** The identifier for the item being changed */
	id: string | Record< string, unknown >;
	/** The changes made to the item */
	changes: Record< string, HistoryChange< T > >;
}

/**
 * Represents a record of history changes.
 */
export type HistoryRecord< T = unknown > = HistoryChanges< T >[];

/**
 * The undo manager interface.
 */
export interface UndoManager< T = unknown > {
	/**
	 * Record changes into the history.
	 *
	 * @param record   A record of changes to record.
	 * @param isStaged Whether to immediately create an undo point or not.
	 */
	addRecord: ( record?: HistoryRecord< T >, isStaged?: boolean ) => void;

	/**
	 * Undo the last recorded changes.
	 *
	 * @return The undone record or undefined if nothing to undo.
	 */
	undo: () => HistoryRecord< T > | undefined;

	/**
	 * Redo the last undone changes.
	 *
	 * @return The redone record or undefined if nothing to redo.
	 */
	redo: () => HistoryRecord< T > | undefined;

	/**
	 * Check if there are changes that can be undone.
	 *
	 * @return Whether there are changes to undo.
	 */
	hasUndo: () => boolean;

	/**
	 * Check if there are changes that can be redone.
	 *
	 * @return Whether there are changes to redo.
	 */
	hasRedo: () => boolean;
}
