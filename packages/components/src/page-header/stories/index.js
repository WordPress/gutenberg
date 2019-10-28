/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';
import faker from 'faker';

/**
 * Internal dependencies
 */
import Button from '../../button';
import Dropdown from '../../dropdown';
import MenuGroup from '../../menu-group';
import MenuItem from '../../menu-item';
import IconButton from '../../icon-button';
import PageHeader from '../';
import './styles.css';

export default { title: 'PageHeader', component: PageHeader };

const InlineActions = () => {
	return (
		<div className="inline-buttons">
			<Button isDefault isPrimary>
				Add New
			</Button>
			<Button isDefault>Add New</Button>
			<Button isDefault>Add New</Button>
		</div>
	);
};

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
	const title = text( 'title', 'Title' );
	const subtitle = text( 'subtitle', faker.lorem.paragraph() );

	const props = {
		title,
		subtitle,
	};

	return (
		<PageHeader { ...props }>
			<InlineActions />
			<DropdownActions />
		</PageHeader>
	);
};

export const simple = () => {
	const title = text( 'title', 'Title' );

	const props = {
		title,
	};

	return (
		<PageHeader { ...props }>
			<InlineActions />
			<DropdownActions />
		</PageHeader>
	);
};

export const actionBar = () => {
	return (
		<PageHeader leftActions={ <IconButton icon="insert" isTertiary /> }>
			<InlineActions />
			<DropdownActions />
		</PageHeader>
	);
};
