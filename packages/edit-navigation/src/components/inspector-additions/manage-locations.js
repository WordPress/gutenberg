/**
 * WordPress dependencies
 */
import {
	Spinner,
	SelectControl,
	CheckboxControl,
	Button,
	Modal,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useMenuLocations } from '../../hooks';

export default function ManageLocations( {
	onSelectMenu,
	isModalOpen,
	openModal,
	closeModal,
	menus,
	selectedMenuId,
} ) {
	const {
		menuLocations,
		assignMenuToLocation,
		toggleMenuLocationAssignment,
	} = useMenuLocations();

	if ( ! menuLocations ) {
		return <Spinner />;
	}

	if ( ! menuLocations.length ) {
		return <p>{ __( 'There are no available menu locations.' ) }</p>;
	}

	const themeLocationCountTextMain = sprintf(
		// translators: Number of available theme locations.
		__(
			'Your current theme provides %d different locations to place menu.'
		),
		menuLocations.length
	);

	const themeLocationCountTextModal = sprintf(
		// translators: Number of available theme locations.
		__(
			'Your current theme supports %d different locations. Select which menu appears in each location.'
		),
		menuLocations.length
	);

	const menusWithSelection = menuLocations.map(
		( { name, description, menu } ) => {
			const menuOnLocation = menus
				.filter( ( { id } ) => ! [ 0, selectedMenuId ].includes( id ) )
				.find( ( { id } ) => id === menu );

			return (
				<li
					key={ name }
					className="edit-navigation-manage-locations__checklist-item"
				>
					<CheckboxControl
						className="edit-navigation-manage-locations__menu-location-checkbox"
						checked={ menu === selectedMenuId }
						onChange={ () =>
							toggleMenuLocationAssignment( name, selectedMenuId )
						}
						label={ description }
						help={
							menuOnLocation &&
							sprintf(
								// translators: menu name.
								__( 'Currently using %s' ),
								menuOnLocation.name
							)
						}
					/>
				</li>
			);
		}
	);

	const menuLocationCard = menuLocations.map( ( menuLocation ) => (
		<div
			key={ menuLocation.name }
			className="edit-navigation-manage-locations__menu-entry"
		>
			<SelectControl
				key={ menuLocation.name }
				className="edit-navigation-manage-locations__select-menu"
				label={ menuLocation.description }
				labelPosition="top"
				value={ menuLocation.menu }
				options={ [
					{ value: 0, label: __( '-' ), key: 0 },
					...menus.map( ( { id, name } ) => ( {
						key: id,
						value: id,
						label: name,
					} ) ),
				] }
				onChange={ ( menuId ) => {
					assignMenuToLocation( menuLocation.name, Number( menuId ) );
				} }
			/>
			<Button
				isSecondary
				style={ {
					visibility: !! menuLocation.menu ? 'visible' : 'hidden',
				} }
				className="edit-navigation-manage-locations__edit-button"
				onClick={ () => (
					closeModal(), onSelectMenu( menuLocation.menu )
				) }
			>
				{ __( 'Edit' ) }
			</Button>
		</div>
	) );

	return (
		<>
			<div className="edit-navigation-manage-locations__theme-location-text-main">
				{ themeLocationCountTextMain }
			</div>
			<ul className="edit-navigation-manage-locations__checklist">
				{ menusWithSelection }
			</ul>
			<Button
				isSecondary
				className="edit-navigation-manage-locations__open-menu-locations-modal-button"
				aria-expanded={ isModalOpen }
				onClick={ openModal }
			>
				{ __( 'Manage locations' ) }
			</Button>
			{ isModalOpen && (
				<Modal
					className="edit-navigation-manage-locations__modal"
					title={ __( 'Manage locations' ) }
					onRequestClose={ closeModal }
				>
					<div className="edit-navigation-manage-locations__theme-location-text-modal">
						{ themeLocationCountTextModal }
					</div>
					{ menuLocationCard }
				</Modal>
			) }
		</>
	);
}
