/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
// @ts-ignore
import { useShortcut } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import type { Language } from '../types';

interface ActiveControlsProps {
	languages: Language[];
	selectedLanguage?: Language;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onRemove: () => void;
}
function ActiveControls( {
	languages,
	selectedLanguage,
	onMoveUp,
	onMoveDown,
	onRemove,
}: ActiveControlsProps ) {
	const isMoveUpDisabled =
		! selectedLanguage ||
		languages[ 0 ]?.locale === selectedLanguage?.locale;
	const isMoveDownDisabled =
		! selectedLanguage ||
		languages[ languages.length - 1 ]?.locale === selectedLanguage?.locale;
	const isRemoveDisabled = ! selectedLanguage;

	useShortcut( 'language-chooser/move-up', ( event: Event ) => {
		event.preventDefault();

		if ( isMoveUpDisabled ) {
			return;
		}

		onMoveUp();
	} );

	useShortcut( 'language-chooser/move-down', ( event: Event ) => {
		event.preventDefault();

		if ( isMoveDownDisabled ) {
			return;
		}

		onMoveDown();
	} );

	useShortcut( 'language-chooser/remove', ( event: Event ) => {
		event.preventDefault();

		if ( isRemoveDisabled ) {
			return;
		}

		onRemove();
	} );

	return (
		<div className="active-locales-controls">
			<ul>
				<li>
					<Button
						variant="secondary"
						showTooltip
						aria-keyshortcuts="ArrowUp"
						aria-label={ sprintf(
							/* translators: accessibility text */
							__( 'Move up (%s)' ),
							/* translators: keyboard shortcut (Arrow Up) */
							__( 'Up' )
						) }
						label={
							/* translators: keyboard shortcut (Arrow Up) */
							__( 'Up' )
						}
						disabled={ isMoveUpDisabled }
						accessibleWhenDisabled
						onClick={ onMoveUp }
					>
						{ __( 'Move Up' ) }
					</Button>
				</li>
				<li>
					<Button
						variant="secondary"
						showTooltip
						aria-keyshortcuts="ArrowDown"
						aria-label={ sprintf(
							/* translators: accessibility text */
							__( 'Move down (%s)' ),
							/* translators: keyboard shortcut (Arrow Down) */
							__( 'Down' )
						) }
						label={
							/* translators: keyboard shortcut (Arrow Down) */
							__( 'Down' )
						}
						disabled={ isMoveDownDisabled }
						accessibleWhenDisabled
						onClick={ onMoveDown }
					>
						{ __( 'Move Down' ) }
					</Button>
				</li>
				<li>
					<Button
						variant="secondary"
						showTooltip
						aria-keyshortcuts="Delete"
						aria-label={ sprintf(
							/* translators: accessibility text */
							__( 'Remove from list (%s)' ),
							/* translators: keyboard shortcut (Delete / Backspace) */
							__( 'Delete' )
						) }
						label={
							/* translators: keyboard shortcut (Delete / Backspace) */
							__( 'Delete' )
						}
						disabled={ isRemoveDisabled }
						accessibleWhenDisabled
						onClick={ onRemove }
					>
						{ __( 'Remove' ) }
					</Button>
				</li>
			</ul>
		</div>
	);
}

export default ActiveControls;
