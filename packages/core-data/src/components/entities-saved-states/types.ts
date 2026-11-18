import type { ReactNode } from 'react';

/**
 * A dirty entity record, or an edited property of the site entity.
 */
export interface EntitySavedStatesRecord {
	kind: string;
	name: string;
	key?: string | number;
	title?: string;
	property?: string;
}

/**
 * Selects or unselects a record to save.
 */
export type SetUnselectedEntities = (
	record: EntitySavedStatesRecord,
	checked: boolean
) => void;

/**
 * The dirty records to save, and those the user unselected.
 */
export interface IsDirtyState {
	/**
	 * The dirty entity records.
	 */
	dirtyEntityRecords: Array< EntitySavedStatesRecord >;
	/**
	 * Whether there are any dirty entity records to save.
	 */
	isDirty: boolean;
	/**
	 * Sets the unselected entities.
	 */
	setUnselectedEntities: SetUnselectedEntities;
	/**
	 * The unselected entities.
	 */
	unselectedEntities: Array< EntitySavedStatesRecord >;
}

/**
 * The props of `EntitiesSavedStates`.
 */
export interface EntitiesSavedStatesProps {
	/**
	 * The function to close the dialog, given the saved entities.
	 */
	close: ( entities?: Array< EntitySavedStatesRecord > ) => void;
	/**
	 * Whether to render the component with modal dialog behavior.
	 */
	renderDialog?: boolean;
	/**
	 * Changes the layout of the component. When an `inline` value is
	 * provided, the action buttons are rendered at the end of the component
	 * instead of at the start.
	 */
	variant?: string;
}

/**
 * The props of `EntitiesSavedStatesExtensible`.
 */
export interface EntitiesSavedStatesExtensibleProps
	extends EntitiesSavedStatesProps, IsDirtyState {
	/**
	 * Additional prompt to display.
	 */
	additionalPrompt?: ReactNode;
	/**
	 * Function to call when saving entities.
	 */
	onSave?: () => unknown;
	/**
	 * Flag indicating if save is enabled.
	 */
	saveEnabled?: boolean;
	/**
	 * Label for the save button.
	 */
	saveLabel?: ReactNode;
	/**
	 * Optional custom success notice content.
	 */
	successNoticeContent?: string;
}

/**
 * The props of `EntityTypeList`.
 */
export interface EntityTypeListProps {
	list: Array< EntitySavedStatesRecord >;
	unselectedEntities: Array< EntitySavedStatesRecord >;
	setUnselectedEntities: SetUnselectedEntities;
}

/**
 * The props of `EntityRecordItem`.
 */
export interface EntityRecordItemProps {
	record: EntitySavedStatesRecord;
	checked: boolean;
	onChange: ( value: boolean ) => void;
}
