/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	Button,
	CheckboxControl,
	Modal,
	PanelBody,
	Spinner,
	SelectControl,
} from '@wordpress/components';
import { decodeEntities } from '@wordpress/html-entities';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { useMenuLocations } from '../../hooks';

export default function ManageLocations( {
	menus,
	selectedMenuId,
	onSelectMenu,
} ) {
	const {
		menuLocations,
		assignMenuToLocation,
		toggleMenuLocationAssignment,
	} = useMenuLocations();
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const openModal = () => setIsModalOpen( true );
	const closeModal = () => setIsModalOpen( false );
	const { createSuccessNotice, createErrorNotice } = useDispatch(
		noticesStore
	);

	const validateBatchResponse = ( batchResponse ) => {
		if ( batchResponse.failed ) {
			return false;
		}

		const errorResponses = batchResponse.responses.filter( ( response ) => {
			return 200 > response.status || 300 <= response.status;
		} );

		return 1 > errorResponses.length;
	};

	const handleUpdateMenuLocations = async () => {
		const method = 'POST';
		const batchRequests = menus.map( ( { id } ) => {
			const locations = menuLocations
				.filter( ( menuLocation ) => menuLocation.menu === id )
				.map( ( menuLocation ) => menuLocation.name );

			return {
				path: `/wp/v2/menus/${ id }`,
				body: {
					locations,
				},
				method,
			};
		} );

		const batchResponse = await apiFetch( {
			path: 'batch/v1',
			data: {
				validation: 'require-all-validate',
				requests: batchRequests,
			},
			method,
		} );

		const isSuccess = validateBatchResponse( batchResponse );

		if ( isSuccess ) {
			createSuccessNotice( __( 'Menu locations have been updated.' ), {
				type: 'snackbar',
			} );
			closeModal();
			return;
		}

		createErrorNotice(
			__( 'An error occurred while trying to update menu locations.' ),
			{ type: 'snackbar' }
		);
	};

	if ( ! menuLocations || ! menus?.length ) {
		return <Spinner />;
	}

	if ( ! menuLocations.length ) {
		return (
			<PanelBody title={ __( 'Theme locations' ) }>
				<p>{ __( 'There are no available menu locations.' ) }</p>
			</PanelBody>
		);
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
								decodeEntities( menuOnLocation.name )
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
				value={ decodeEntities( menuLocation.menu ) }
				options={ [
					{ value: 0, label: __( 'Select a Menu' ), key: 0 },
					...menus.map( ( { id, name } ) => ( {
						key: id,
						value: id,
						label: decodeEntities( name ),
					} ) ),
				] }
				onChange={ ( menuId ) => {
					assignMenuToLocation( menuLocation.name, Number( menuId ) );
				} }
			/>
			<Button
				variant="secondary"
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
		<PanelBody title={ __( 'Theme locations' ) }>
			<div className="edit-navigation-manage-locations__theme-location-text-main">
				{ themeLocationCountTextMain }
			</div>
			<ul className="edit-navigation-manage-locations__checklist">
				{ menusWithSelection }
			</ul>
			<Button
				variant="secondary"
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
					<Button
						className="edit-navigation-manage-locations__save-button"
						variant="primary"
						onClick={ handleUpdateMenuLocations }
					>
						{ __( 'Update' ) }
					</Button>
				</Modal>
			) }
		</PanelBody>
	);
}
