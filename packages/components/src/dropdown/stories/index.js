/**
 * Internal dependencies
 */
import Dropdown from '../';
import IconButton from '../../icon-button';
import MenuGroup from '../../menu-group';
import MenuItem from '../../menu-item';
import DropdownMenu from '../../dropdown-menu';

export default { title: 'Components|Dropdown', component: Dropdown };

const DropdownAndDropdownMenuExample = () => {
	return (
		<div>
			<DropdownMenu
				icon="move"
				label="Select a direction"
				controls={ [
					{
						title: 'Up',
						icon: 'arrow-up-alt',
						onClick: () => console.log( 'up' ),
					},
					{
						title: 'Right',
						icon: 'arrow-right-alt',
						onClick: () => console.log( 'right' ),
					},
					{
						title: 'Down',
						icon: 'arrow-down-alt',
						onClick: () => console.log( 'down' ),
					},
					{
						title: 'Left',
						icon: 'arrow-left-alt',
						onClick: () => console.log( 'left' ),
					},
				] }
			/>

			<Dropdown
				className="my-container-class-name"
				contentClassName="my-popover-content-classname"
				position="bottom right"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<IconButton
						icon="move"
						onClick={ onToggle }
						aria-expanded={ isOpen }
						label="Select a direction"
					/>
				) }
				renderContent={ () => (
					<MenuGroup>
						<MenuItem
							icon="arrow-up-alt"
							onClick={ () => console.log( 'up' ) }
						>
							Up
						</MenuItem>
						<MenuItem
							icon="arrow-down-alt"
							onClick={ () => console.log( 'up' ) }
						>
							Down
						</MenuItem>
						<MenuItem
							icon="arrow-left-alt"
							onClick={ () => console.log( 'up' ) }
						>
							Left
						</MenuItem>
						<MenuItem
							icon="arrow-right-alt"
							onClick={ () => console.log( 'up' ) }
						>
							Right
						</MenuItem>
					</MenuGroup>
				) }
			/>
		</div>
	);
};

export const _default = () => {
	return <DropdownAndDropdownMenuExample />;
};
