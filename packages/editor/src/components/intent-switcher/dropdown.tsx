import clsx from 'clsx';
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { commentEditLink, pencil } from '@wordpress/icons';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components
	Menu,
} from '@wordpress/ui';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { EDITOR_INTENT_SUGGEST } from '../../store/constants';
import PostTypeSupportCheck from '../post-type-support-check';
import { IntentRadioGroup } from '.';

/**
 * Header button that names the current editor intent and opens a menu to
 * change it. Below the `large` breakpoint it collapses to its icon, and the
 * stylesheet hides it on a phone.
 */
function IntentDropdown() {
	const { isSuggesting, showIconLabels } = useSelect(
		( select ) => ( {
			isSuggesting:
				unlock( select( editorStore ) ).getEditorIntent() ===
				EDITOR_INTENT_SUGGEST,
			showIconLabels: select( preferencesStore ).get(
				'core',
				'showIconLabels'
			),
		} ),
		[]
	);
	const isWideViewport = useViewportMatch( 'large' );
	const showText = isWideViewport || showIconLabels;
	const text = isSuggesting ? __( 'Suggesting' ) : __( 'Editing' );
	const icon = isSuggesting ? commentEditLink : pencil;
	const label = sprintf(
		/* translators: %s: The active editor mode, "Editing" or "Suggesting". */
		__( 'Mode: %s' ),
		text
	);

	return (
		<PostTypeSupportCheck supportKeys="editor.notes">
			<Menu.Root modal={ false }>
				<Menu.Trigger
					render={
						<Button
							className={ clsx(
								'editor-intent-dropdown__toggle',
								{
									'is-suggesting': isSuggesting,
								}
							) }
							size="compact"
							// With text labels on, the header hides every
							// icon and prints the `aria-label` in its place.
							icon={ showIconLabels ? undefined : icon }
							label={ label }
							showTooltip={ ! showText }
							tooltipPosition="bottom"
						>
							{ showText && text }
						</Button>
					}
				/>
				<Menu.Popup
					className="editor-intent-dropdown__popup"
					positioner={ <Menu.Positioner align="end" /> }
				>
					<IntentRadioGroup closeOnClick />
				</Menu.Popup>
			</Menu.Root>
		</PostTypeSupportCheck>
	);
}

export default IntentDropdown;
