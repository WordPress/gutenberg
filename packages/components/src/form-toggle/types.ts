/**
 * External dependencies
 */
import type { ChangeEvent } from 'react';

export type FormToggleProps = {
	/**
	 * If checked is true the toggle will be checked. If checked is false the
	 * toggle will be unchecked. If no value is passed the toggle will be
	 * unchecked.
	 */
	checked?: boolean;
	/**
	 * If disabled is true the toggle will be disabled and apply the appropriate
	 * styles.
	 */
	disabled?: boolean;
	/**
	 * A callback function invoked when the toggle is clicked.
	 */
	onChange: ( event: ChangeEvent< HTMLInputElement > ) => void;
};
