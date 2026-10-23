import { useState } from '@wordpress/element';
import { reaction } from '@wordpress/icons';
import * as Menu from '../';
import { IconButton } from '../../icon-button';
import * as Tooltip from '../../tooltip';
import styles from './emoji-menu.module.css';

const REACTIONS = [
	{ id: 'celebration', emoji: '🎉', label: 'Celebration' },
	{ id: 'smile', emoji: '😄', label: 'Smile' },
	{ id: 'rocket', emoji: '🚀', label: 'Rocket' },
	{ id: 'eyes', emoji: '👀', label: 'Eyes' },
	{ id: 'heart', emoji: '❤️', label: 'Heart' },
];

export function EmojiMenuExample() {
	const [ open, setOpen ] = useState( false );
	const [ selected, setSelected ] = useState( [ 'heart' ] );
	const toggleReaction = ( id: string ) =>
		setSelected( ( current ) =>
			current.includes( id )
				? current.filter( ( value ) => value !== id )
				: [ ...current, id ]
		);

	return (
		<Tooltip.Provider>
			<Menu.Root
				orientation="horizontal"
				highlightItemOnHover={ false }
				open={ open }
				onOpenChange={ setOpen }
			>
				<Menu.Trigger
					render={
						<IconButton
							icon={ reaction }
							label="Add reaction"
							variant="minimal"
							tone="neutral"
							size="small"
						/>
					}
				/>
				<Menu.Popup
					aria-label="Add reaction"
					width="content"
					onKeyDownCapture={ ( event ) => {
						// Dismiss the menu and its tooltip with one Escape.
						if ( event.key === 'Escape' ) {
							event.stopPropagation();
							setOpen( false );
						}
					} }
				>
					{ REACTIONS.map( ( { id, emoji, label } ) => (
						<Tooltip.Root key={ id }>
							<Tooltip.Trigger
								render={
									<Menu.CheckboxItem
										checked={ selected.includes( id ) }
										onCheckedChange={ () =>
											toggleReaction( id )
										}
										closeOnClick
										label={ label }
										aria-label={ label }
									>
										<Menu.ItemLabel>
											<span
												aria-hidden="true"
												className={ styles.emoji }
											>
												{ emoji }
											</span>
										</Menu.ItemLabel>
									</Menu.CheckboxItem>
								}
							/>
							<Tooltip.Popup
								positioner={ <Tooltip.Positioner side="top" /> }
							>
								{ label }
							</Tooltip.Popup>
						</Tooltip.Root>
					) ) }
				</Menu.Popup>
			</Menu.Root>
		</Tooltip.Provider>
	);
}
