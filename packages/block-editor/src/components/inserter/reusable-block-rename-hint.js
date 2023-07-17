/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { focus } from '@wordpress/dom';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { store as preferencesStore } from '@wordpress/preferences';

const PREFERENCE_NAME = 'isResuableBlocksrRenameHintVisible';
/*
 * This hook was added in 6.3 to help users with the transition from Reusable blocks to Patterns.
 * It is only exported for use in the reusable-blocks package as well as block-editor.
 * It will be removed in 6.4. and should not be used in any new code.
 */
export function useReusableBlocksRenameHint() {
	return useSelect(
		( select ) =>
			select( preferencesStore ).get( 'core', PREFERENCE_NAME ) ?? true,
		[]
	);
}

/*
 * This component was added in 6.3 to help users with the transition from Reusable blocks to Patterns.
 * It is only exported for use in the reusable-blocks package as well as block-editor.
 * It will be removed in 6.4. and should not be used in any new code.
 */
export default function ReusableBlocksRenameHint() {
	const isReusableBlocksRenameHint = useSelect(
		( select ) =>
			select( preferencesStore ).get( 'core', PREFERENCE_NAME ) ?? true,
		[]
	);

	const ref = useRef();

	const { set: setPreference } = useDispatch( preferencesStore );
	if ( ! isReusableBlocksRenameHint ) {
		return null;
	}

	return (
		<div ref={ ref } className="reusable-blocks-menu-items__rename-hint">
			<div className="reusable-blocks-menu-items__rename-hint-content">
				{ __(
					'Reusable blocks are now synced patterns. A synced pattern will behave in exactly the same way as a reusable block.'
				) }
			</div>
			<Button
				className="reusable-blocks-menu-items__rename-hint-dismiss"
				icon={ close }
				iconSize="16"
				label={ __( 'Dismiss hint' ) }
				onClick={ () => {
					// Retain focus when dismissing the element.
					const previousElement = focus.tabbable.findPrevious(
						ref.current
					);
					previousElement?.focus();
					setPreference( 'core', PREFERENCE_NAME, false );
				} }
				showTooltip={ false }
			/>
		</div>
	);
}
