/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useLinkControlV2Context } from './context';
import type { LinkValue } from './types';

/**
 * Hook for consumers to access and control LinkControlV2 state.
 *
 * Provides access to committed/uncommitted values and methods to control them.
 * This allows consumers to override default behavior when needed.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { committedValue, uncommittedValue, commitValue, setUncommittedValue } = useLinkControlV2();
 *
 *   // Access current values
 *   console.log('Committed:', committedValue);
 *   console.log('Uncommitted:', uncommittedValue);
 *
 *   // Override commit behavior
 *   const handleCustomCommit = () => {
 *     // Custom logic
 *     commitValue();
 *   };
 * }
 * ```
 */
export function useLinkControlV2() {
	const context = useLinkControlV2Context();

	return {
		/**
		 * The committed (saved) link value.
		 */
		committedValue: context.committedValue,
		/**
		 * The uncommitted (being edited) link value.
		 */
		uncommittedValue: context.uncommittedValue,
		/**
		 * Set the uncommitted value directly.
		 */
		setUncommittedValue: context.setUncommittedValue,
		/**
		 * Commit the uncommitted value (makes it the committed value).
		 */
		commitValue: context.commitValue,
		/**
		 * Revert uncommitted value back to committed value.
		 */
		revertValue: context.revertValue,
		/**
		 * Whether the component is in editing mode.
		 */
		isEditing: context.isEditing,
		/**
		 * Set editing mode.
		 */
		setIsEditing: context.setIsEditing,
		/**
		 * Update a specific property of the uncommitted value.
		 */
		updateUncommittedValue: useCallback(
			( updates: Partial< LinkValue > ) => {
				context.setUncommittedValue( {
					...context.uncommittedValue,
					...updates,
				} );
			},
			[ context ]
		),
		/**
		 * Update the URL in the uncommitted value.
		 */
		setUncommittedURL: useCallback(
			( url: string ) => {
				context.setUncommittedValue( {
					...context.uncommittedValue,
					url,
				} );
			},
			[ context ]
		),
		/**
		 * Update the label (link text) in the uncommitted value.
		 * This is the text displayed in the link, distinct from the entity title.
		 */
		setUncommittedLabel: useCallback(
			( label: string ) => {
				context.setUncommittedValue( {
					...context.uncommittedValue,
					label,
				} );
			},
			[ context ]
		),
	};
}

