/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalHeading as Heading,
	DropdownMenu,
	MenuGroup,
	MenuItem,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	Modal,
} from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import { moreVertical } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import DataViewItem from './dataview-item';
import AddNewItem from './add-new-view';
import { unlock } from '../../lock-unlock';

const { useHistory, useLocation } = unlock( routerPrivateApis );

const EMPTY_ARRAY = [];

function RenameItemModalContent( { dataviewId, currentTitle, setIsRenaming } ) {
	const { editEntityRecord } = useDispatch( coreStore );
	const [ title, setTitle ] = useState( currentTitle );
	return (
		<form
			onSubmit={ async ( event ) => {
				event.preventDefault();
				await editEntityRecord(
					'postType',
					'wp_dataviews',
					dataviewId,
					{
						title,
					}
				);
				setIsRenaming( false );
			} }
		>
			<VStack spacing="5">
				<TextControl
					__next40pxDefaultSize
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
						__next40pxDefaultSize
						onClick={ () => {
							setIsRenaming( false );
						} }
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						type="submit"
						aria-disabled={ ! title }
						__next40pxDefaultSize
					>
						{ __( 'Save' ) }
					</Button>
				</HStack>
			</VStack>
		</form>
	);
}

function CustomDataViewItem( { dataviewId, isActive } ) {
	const history = useHistory();
	const location = useLocation();
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
	const { deleteEntityRecord } = useDispatch( coreStore );
	const type = useMemo( () => {
		const viewContent = JSON.parse( dataview.content );
		return viewContent.type;
	}, [ dataview.content ] );
	const [ isRenaming, setIsRenaming ] = useState( false );
	return (
		<>
			<DataViewItem
				title={ dataview.title }
				type={ type }
				isActive={ isActive }
				isCustom
				customViewId={ dataviewId }
				suffix={
					<DropdownMenu
						icon={ moreVertical }
						label={ __( 'Actions' ) }
						className="edit-site-sidebar-dataviews-dataview-item__dropdown-menu"
						toggleProps={ {
							style: {
								color: 'inherit',
							},
							size: 'small',
						} }
					>
						{ ( { onClose } ) => (
							<MenuGroup>
								<MenuItem
									onClick={ () => {
										setIsRenaming( true );
										onClose();
									} }
								>
									{ __( 'Rename' ) }
								</MenuItem>
								<MenuItem
									onClick={ async () => {
										await deleteEntityRecord(
											'postType',
											'wp_dataviews',
											dataview.id,
											{
												force: true,
											}
										);
										if ( isActive ) {
											history.replace( {
												postType:
													location.query.postType,
											} );
										}
										onClose();
									} }
									isDestructive
								>
									{ __( 'Delete' ) }
								</MenuItem>
							</MenuGroup>
						) }
					</DropdownMenu>
				}
			/>
			{ isRenaming && (
				<Modal
					title={ __( 'Rename' ) }
					onRequestClose={ () => {
						setIsRenaming( false );
					} }
					focusOnMount="firstContentElement"
					size="small"
				>
					<RenameItemModalContent
						dataviewId={ dataviewId }
						setIsRenaming={ setIsRenaming }
						currentTitle={ dataview.title }
					/>
				</Modal>
			) }
		</>
	);
}

export function useCustomDataViews( type ) {
	const customDataViews = useSelect( ( select ) => {
		const { getEntityRecords } = select( coreStore );
		const dataViewTypeRecords = getEntityRecords(
			'taxonomy',
			'wp_dataviews_type',
			{ slug: type }
		);
		if ( ! dataViewTypeRecords || dataViewTypeRecords.length === 0 ) {
			return EMPTY_ARRAY;
		}
		const dataViews = getEntityRecords( 'postType', 'wp_dataviews', {
			wp_dataviews_type: dataViewTypeRecords[ 0 ].id,
			orderby: 'date',
			order: 'asc',
		} );
		if ( ! dataViews ) {
			return EMPTY_ARRAY;
		}
		return dataViews;
	} );
	return customDataViews;
}

export default function CustomDataViewsList( { type, activeView, isCustom } ) {
	const customDataViews = useCustomDataViews( type );
	return (
		<>
			<div className="edit-site-sidebar-navigation-screen-dataviews__group-header">
				<Heading level={ 2 }>{ __( 'Custom Views' ) }</Heading>
			</div>
			<ItemGroup className="edit-site-sidebar-navigation-screen-dataviews__custom-items">
				{ customDataViews.map( ( customViewRecord ) => {
					return (
						<CustomDataViewItem
							key={ customViewRecord.id }
							dataviewId={ customViewRecord.id }
							isActive={
								isCustom &&
								Number( activeView ) === customViewRecord.id
							}
						/>
					);
				} ) }
				<AddNewItem type={ type } />
			</ItemGroup>
		</>
	);
}
