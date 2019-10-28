/**
 * External dependencies
 */
import { select, text } from '@storybook/addon-knobs';

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
	const actionsPlacement = select(
		'Example: Actions Placement',

		{
			Right: 'right',
			Bottom: 'bottom',
		},
		'bottom'
	);

	const title = text( 'title', 'Title' );
	const subtitle = text( 'subtitle', 'Subtitle Content' );

	const props = {
		title,
		subtitle,
	};

	const isPlacedRight = actionsPlacement === 'right';
	const isPlacedBottom = ! isPlacedRight;

	return (
		<PageHeader
			{ ...props }
			rightActions={
				<>
					{ isPlacedRight ? <InlineActions /> : null }
					<DropdownActions />
				</>
			}
		>
			{ isPlacedBottom ? <InlineActions /> : null }
		</PageHeader>
	);
};

export const simple = () => {
	const title = text( 'title', 'Title' );

	const props = {
		title,
	};

	return (
		<PageHeader
			{ ...props }
			rightActions={
				<>
					<InlineActions />
					<DropdownActions />
				</>
			}
		/>
	);
};

export const actionBar = () => {
	return (
		<PageHeader
			leftActions={ <IconButton icon="insert" isTertiary /> }
			rightActions={
				<>
					<InlineActions />
					<DropdownActions />
				</>
			}
		></PageHeader>
	);
};
