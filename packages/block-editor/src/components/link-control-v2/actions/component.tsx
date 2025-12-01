/**
 * External dependencies
 */
import type { MouseEvent } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef, useMemo } from '@wordpress/element';
import { Button, __experimentalHStack as HStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isShallowEqualObjects } from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import { useLinkControlV2Context } from '../context';


interface ActionsProps {
	/**
	 * Custom callback for Cancel button click.
	 * If provided, overrides the default behavior of reverting changes and exiting edit mode.
	 */
	onCancel?: () => void;
}

/**
 * Actions subcomponent for LinkControlV2.
 *
 * Provides Apply and Cancel buttons that commit or revert changes.
 * Rendering is controlled by composition (default or custom).
 * Apply button is disabled when there are no changes or when the URL is empty.
 *
 * By default, Cancel reverts changes and exits edit mode (showing Preview).
 * This can be customized via the `onCancel` prop.
 */
export const Actions = forwardRef< HTMLDivElement, ActionsProps >(
	function Actions( { onCancel, ...props }, ref ) {
		const {
			committedValue,
			uncommittedValue,
			commitValue,
			revertValue,
			isEditing,
			setIsEditing,
		} = useLinkControlV2Context();

		// Determine if there are changes between committed and uncommitted values
		const hasChanges = useMemo( () => {
			if ( ! committedValue && ! uncommittedValue ) {
				return false;
			}
			if ( ! committedValue || ! uncommittedValue ) {
				return true;
			}
			return ! isShallowEqualObjects( committedValue, uncommittedValue );
		}, [ committedValue, uncommittedValue ] );

		// Check if the URL input is empty
		const isURLEmpty = ! uncommittedValue?.url?.trim()?.length;

		// Apply button is disabled if no changes or URL is empty
		const isApplyDisabled = ! hasChanges || isURLEmpty;

		// Handle Apply button click
		const handleApply = () => {
			if ( ! isApplyDisabled ) {
				commitValue();
				setIsEditing( false );
			}
		};

		// Handle Cancel button click
		const handleCancel = ( event: MouseEvent< HTMLButtonElement > ) => {
			event.preventDefault();
			event.stopPropagation();

			// If custom onCancel is provided, use it
			if ( onCancel ) {
				onCancel();
				return;
			}

			// Default behavior: revert changes and exit edit mode (shows Preview)
			revertValue();

			// If there's a committed link value, exit editing mode and show preview
			// Otherwise, stay in editing mode (empty state)
			if ( ( committedValue?.url?.trim()?.length ?? 0 ) > 0 ) {
				setIsEditing( false );
			}
		};

		return (
			<HStack
				ref={ ref }
				justify="right"
				className="block-editor-link-control-v2__actions"
				{ ...props }
			>
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					onClick={ handleCancel }
				>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					variant="primary"
					onClick={ handleApply }
					disabled={ isApplyDisabled }
					className="block-editor-link-control-v2__apply"
				>
					{ __( 'Apply' ) }
				</Button>
			</HStack>
		);
	}
);

Actions.displayName = 'LinkControlV2.Actions';
