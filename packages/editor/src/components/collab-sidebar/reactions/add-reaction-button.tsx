import { __ } from '@wordpress/i18n';
/*
 * `IconButton` is pending Design System review (WordPress/gutenberg#76135);
 * used here so the trigger matches the reaction pills beside it.
 */
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { IconButton, Menu } from '@wordpress/ui';
import { reaction as reactionIcon } from '@wordpress/icons';
import { REACTION_EMOJIS } from './reaction-emojis';

interface AddReactionButtonProps {
	disabled?: boolean;
	onToggleReaction: ( hexKey: string ) => void;
}

/**
 * The add-reaction button, opening a menu of the reaction emoji.
 *
 * @param props                  Component props.
 * @param props.disabled         Whether the button is disabled (e.g. on a
 *                               resolved note thread).
 * @param props.onToggleReaction Callback to toggle a reaction.
 */
export function AddReactionButton( {
	disabled = false,
	onToggleReaction,
}: AddReactionButtonProps ) {
	return (
		<Menu.Root>
			<Menu.Trigger
				disabled={ disabled }
				render={
					<IconButton
						size="small"
						// A plain glyph, per the design: no ring or fill at rest.
						variant="minimal"
						tone="neutral"
						className="editor-collab-sidebar-panel__add-reaction-button"
						icon={ reactionIcon }
						label={ __( 'Add reaction' ) }
					/>
				}
			/>
			<Menu.Popup
				aria-label={ __( 'Add reaction' ) }
				positioner={ <Menu.Positioner side="bottom" align="end" /> }
			>
				{ REACTION_EMOJIS.map( ( { emoji, hexKey, label } ) => (
					<Menu.Item
						key={ hexKey }
						onClick={ () => onToggleReaction( hexKey ) }
						prefix={
							<span
								className="editor-collab-sidebar-panel__reaction-option-emoji"
							>
								{ emoji }
							</span>
						}
					>
						<Menu.ItemLabel>{ label }</Menu.ItemLabel>
					</Menu.Item>
				) ) }
			</Menu.Popup>
		</Menu.Root>
	);
}
