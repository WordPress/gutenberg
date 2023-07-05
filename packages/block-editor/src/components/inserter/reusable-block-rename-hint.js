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
					'Reusable blocks are now called patterns. A synced pattern will behave in exactly the same way as a reusable block.'
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
