/**
 * Internal dependencies
 */
import Dropdown from '../../dropdown';
import MenuGroup from '../../menu-group';
import MenuItem from '../../menu-item';
import IconButton from '../../icon-button';
import ActionBar from '../';
import ActionBarBlock from '../block';
import ActionBarItem from '../item';

export default { title: 'ActionBar', component: ActionBar };

const DropdownActions = () => {
	return (
		<div className="additional-actions">
			<Dropdown
				className="my-container-class-name"
				contentClassName="my-popover-content-classname"
				position="bottom right"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<IconButton
						icon="ellipsis"
						isTertiary
						onClick={ onToggle }
						aria-expanded={ isOpen }
					/>
				) }
				renderContent={ () => (
					<MenuGroup>
						<MenuItem icon="star-filled">Favorite</MenuItem>
						<MenuItem icon="share-alt2">Share</MenuItem>
						<MenuItem icon="admin-generic">Settings</MenuItem>
					</MenuGroup>
				) }
			/>
		</div>
	);
};

export const _default = () => {
	return (
		<ActionBar>
			<ActionBarItem>
				<IconButton icon="insert" isTertiary />
			</ActionBarItem>
			<ActionBarBlock />
			<ActionBarItem>
				<DropdownActions />
			</ActionBarItem>
		</ActionBar>
	);
};

export const backAndTitle = () => {
	return (
		<ActionBar>
			<ActionBarItem>
				<IconButton icon="arrow-left-alt" isTertiary />
			</ActionBarItem>
			<ActionBarItem>
				<h3 style={ { margin: 0 } }>Title</h3>
			</ActionBarItem>
			<ActionBarBlock />
		</ActionBar>
	);
};
