/**
 * WordPress dependencies
 */
import {
	more,
	arrowLeft,
	arrowRight,
	arrowUp,
	arrowDown,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Dropdown from '../';
import Button from '../../button';
import MenuGroup from '../../menu-group';
import MenuItem from '../../menu-item';
import DropdownMenu from '../../dropdown-menu';

export default { title: 'Components/Dropdown', component: Dropdown };

const DropdownAndDropdownMenuExample = () => {
	return (
		<>
			<div>
				<p>This is a DropdownMenu component:</p>
				<DropdownMenu
					icon={ more }
					label="Select a direction"
					controls={ [
						{
							title: 'Up',
							icon: arrowUp,
						},
						{
							title: 'Right',
							icon: arrowRight,
						},
						{
							title: 'Down',
							icon: arrowDown,
						},
						{
							title: 'Left',
							icon: arrowLeft,
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
							icon={ more }
							onClick={ onToggle }
							aria-expanded={ isOpen }
							label="Select a direction"
						/>
					) }
					renderContent={ () => (
						<MenuGroup>
							<MenuItem icon={ arrowUp }>Up</MenuItem>
							<MenuItem icon={ arrowDown }>Down</MenuItem>
							<MenuItem icon={ arrowLeft }>Left</MenuItem>
							<MenuItem icon={ arrowRight }>Right</MenuItem>
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
