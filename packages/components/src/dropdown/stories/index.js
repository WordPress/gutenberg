/**
 * Internal dependencies
 */
import Dropdown from '../';
import Button from '../../button';
import MenuGroup from '../../menu-group';
import MenuItem from '../../menu-item';
import DropdownMenu from '../../dropdown-menu';

export default { title: 'Components|Dropdown', component: Dropdown };

const DropdownAndDropdownMenuExample = () => {
	return (
		<>
			<div>
				<p>This is a DropdownMenu component:</p>
				<DropdownMenu
					icon="move"
					label="Select a direction"
					controls={ [
						{
							title: 'Up',
							icon: 'arrow-up-alt',
						},
						{
							title: 'Right',
							icon: 'arrow-right-alt',
						},
						{
							title: 'Down',
							icon: 'arrow-down-alt',
						},
						{
							title: 'Left',
							icon: 'arrow-left-alt',
						},
					] }
				/>
			</div>
			<div>
				<p>This is an assembled Dropdown component:</p>
				<Dropdown
					className="my-container-class-name"
					contentClassName="my-popover-content-classname"
					position="bottom right"
					renderToggle={ ( { isOpen, onToggle } ) => (
						<Button
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
							>
							Up
							</MenuItem>
							<MenuItem
								icon="arrow-down-alt"
							>
							Down
							</MenuItem>
							<MenuItem
								icon="arrow-left-alt"
							>
							Left
							</MenuItem>
							<MenuItem
								icon="arrow-right-alt"
							>
							Right
							</MenuItem>
						</MenuGroup>
					) }
				/>
			</div>
		</>
	);
};

export const _default = () => {
	return <DropdownAndDropdownMenuExample />;
};
