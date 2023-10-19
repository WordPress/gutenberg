/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	DropdownMenu,
	MenuGroup,
	MenuItem,
	Modal,
	Button,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { moreVertical, plus, page, columns } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useContext, useState, useEffect, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import SidebarNavigationItem from '../sidebar-navigation-item';
import DataviewsContext from '../dataviews/context';
import { DEFAULT_VIEWS } from './provider';

function DataViewItem( { dataviewId, setCurrentViewId, isActive } ) {
	const { dataview } = useSelect(
		( select ) => {
			const { getEditedEntityRecord } = select( coreStore );
			return {
				dataview: getEditedEntityRecord(
					'postType',
					'wp_dataviews',
					dataviewId
				),
			};
		},
		[ dataviewId ]
	);
	const icon = useMemo( () => {
		const viewContent = JSON.parse( dataview.content );
		switch ( viewContent.type ) {
			case 'list':
				return page;
			case 'grid':
				return columns;
		}
	}, [ dataview.content ] );
	return (
		<SidebarNavigationItem
			icon={ icon }
			onClick={ () => {
				setCurrentViewId( dataviewId );
			} }
			aria-current={ isActive ? 'true' : undefined }
			suffix={
				<DropdownMenu
					icon={ moreVertical }
					label={ __( 'Actions' ) }
					toggleProps={ {
						style: {
							color: 'inherit',
						},
					} }
				>
					{ ( { onClose } ) => (
						<MenuGroup>
							<MenuItem onClick={ () => onClose() }>
								{ __( 'Rename' ) }
							</MenuItem>
							<MenuItem onClick={ () => onClose() }>
								{ __( 'Delete' ) }
							</MenuItem>
						</MenuGroup>
					) }
				</DropdownMenu>
			}
		>
			{ dataview.title }
		</SidebarNavigationItem>
	);
}

function AddNewItem( { type, taxonomyId } ) {
	const { saveEntityRecord } = useDispatch( coreStore );

	const [ isAdding, setIsAdding ] = useState( false );
	const [ title, setTitle ] = useState( '' );
	const { dataViewIsSaving } = useSelect( ( select ) => {
		const { isSavingEntityRecord } = select( coreStore );
		return {
			dataViewIsSaving: isSavingEntityRecord(
				'postType',
				'wp_dataviews'
			),
		};
	}, [] );
	useEffect( () => {
		if ( ! dataViewIsSaving ) {
			setIsAdding( false );
		}
	}, [ dataViewIsSaving ] );
	useEffect( () => {
		if ( ! isAdding ) {
			setTitle( '' );
		}
	}, [ isAdding ] );
	if ( ! DEFAULT_VIEWS[ type ] ) {
		return null;
	}

	return (
		<>
			<SidebarNavigationItem
				icon={ plus }
				onClick={ () => {
					setIsAdding( true );
				} }
				className="dataviews__siderbar-content-add-new-item"
			>
				{ __( 'New view' ) }
			</SidebarNavigationItem>
			{ isAdding && (
				<Modal
					title={ __( 'Add new view' ) }
					onRequestClose={ () => {
						setIsAdding( false );
					} }
					overlayClassName=""
				>
					<form
						onSubmit={ ( event ) => {
							saveEntityRecord( 'postType', 'wp_dataviews', {
								title,
								status: 'publish',
								wp_dataviews_type: taxonomyId,
								content: JSON.stringify(
									DEFAULT_VIEWS[ type ]
								),
							} );
							event.preventDefault();
						} }
					>
						<VStack spacing="5">
							<TextControl
								__nextHasNoMarginBottom
								label={ __( 'Name' ) }
								value={ title }
								onChange={ setTitle }
								placeholder={ __( 'My view' ) }
								className="patterns-create-modal__name-input"
							/>
							<HStack justify="right">
								<Button
									variant="tertiary"
									onClick={ () => {
										setIsAdding( false );
									} }
								>
									{ __( 'Cancel' ) }
								</Button>

								<Button
									variant="primary"
									type="submit"
									aria-disabled={
										! title || dataViewIsSaving
									}
									isBusy={ dataViewIsSaving }
								>
									{ __( 'Create' ) }
								</Button>
							</HStack>
						</VStack>
					</form>
				</Modal>
			) }
		</>
	);
}

export default function DataViewsSidebarContent() {
	const { dataviews, type, taxonomyId, currentViewId, setCurrentViewId } =
		useContext( DataviewsContext );
	if ( ! dataviews || ! dataviews.length ) {
		return null;
	}
	return (
		<ItemGroup>
			{ dataviews.map( ( dataview ) => {
				return (
					<DataViewItem
						key={ dataview.id }
						dataviewId={ dataview.id }
						setCurrentViewId={ setCurrentViewId }
						isActive={ dataview.id === currentViewId }
					/>
				);
			} ) }
			<AddNewItem type={ type } taxonomyId={ taxonomyId } />
		</ItemGroup>
	);
}
