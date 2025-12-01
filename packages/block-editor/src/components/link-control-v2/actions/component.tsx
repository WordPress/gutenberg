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

const noop = () => {};

/**
 * Actions subcomponent for LinkControlV2.
 *
 * Provides Apply and Cancel buttons that commit or revert changes.
 * Only shown when editing and there's a URL value.
 */
export const Actions = forwardRef< HTMLDivElement >(
	function Actions( props, ref ) {
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

		// Check if there's a link value (committed or uncommitted)
		// Actions are shown when editing and there's a URL value
		const hasLinkValue =
			( committedValue?.url?.trim()?.length ?? 0 ) > 0 ||
			( uncommittedValue?.url?.trim()?.length ?? 0 ) > 0;

		// Apply button is disabled if no changes or URL is empty
		const isApplyDisabled = ! hasChanges || isURLEmpty;

		// Only show actions when editing and there's a URL value
		const showActions = isEditing && hasLinkValue;

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

			// Revert any uncommitted changes
			revertValue();

			// If there's a committed link value, exit editing mode and show preview
			// Otherwise, stay in editing mode (empty state)
			if ( ( committedValue?.url?.trim()?.length ?? 0 ) > 0 ) {
				setIsEditing( false );
			}
		};

		if ( ! showActions ) {
			return null;
		}

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
					onClick={ isApplyDisabled ? noop : handleApply }
					className="block-editor-link-control-v2__apply"
					aria-disabled={ isApplyDisabled }
				>
					{ __( 'Apply' ) }
				</Button>
			</HStack>
		);
	}
);

Actions.displayName = 'LinkControlV2.Actions';
