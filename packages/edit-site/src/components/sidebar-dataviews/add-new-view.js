/**
 * WordPress dependencies
 */
import {
	Modal,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useState } from '@wordpress/element';
import { plus } from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import SidebarNavigationItem from '../sidebar-navigation-item';
import { useDefaultViews } from './default-views';
import { unlock } from '../../lock-unlock';

const { useLocation, useHistory } = unlock( routerPrivateApis );

function AddNewItemModalContent( { type, setIsAdding } ) {
	const history = useHistory();
	const { path } = useLocation();
	const { saveEntityRecord } = useDispatch( coreStore );
	const [ title, setTitle ] = useState( '' );
	const [ isSaving, setIsSaving ] = useState( false );
	const defaultViews = useDefaultViews( { postType: type } );
	return (
		<form
			onSubmit={ async ( event ) => {
				event.preventDefault();
				setIsSaving( true );
				const { getEntityRecords } = resolveSelect( coreStore );
				let dataViewTaxonomyId;
				const dataViewTypeRecords = await getEntityRecords(
					'taxonomy',
					'wp_dataviews_type',
					{ slug: type }
				);
				if ( dataViewTypeRecords && dataViewTypeRecords.length > 0 ) {
					dataViewTaxonomyId = dataViewTypeRecords[ 0 ].id;
				} else {
					const record = await saveEntityRecord(
						'taxonomy',
						'wp_dataviews_type',
						{ name: type }
					);
					if ( record && record.id ) {
						dataViewTaxonomyId = record.id;
					}
				}
				const savedRecord = await saveEntityRecord(
					'postType',
					'wp_dataviews',
					{
						title,
						status: 'publish',
						wp_dataviews_type: dataViewTaxonomyId,
						content: JSON.stringify( defaultViews[ 0 ].view ),
					}
				);
				history.navigate(
					addQueryArgs( path, {
						activeView: savedRecord.id,
						isCustom: 'true',
					} )
				);
				setIsSaving( false );
				setIsAdding( false );
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
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ () => {
							setIsAdding( false );
						} }
					>
						{ __( 'Cancel' ) }
					</Button>

					<Button
						__next40pxDefaultSize
						variant="primary"
						type="submit"
						aria-disabled={ ! title || isSaving }
						isBusy={ isSaving }
					>
						{ __( 'Create' ) }
					</Button>
				</HStack>
			</VStack>
		</form>
	);
}

export default function AddNewItem( { type } ) {
	const [ isAdding, setIsAdding ] = useState( false );
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
				>
					<AddNewItemModalContent
						type={ type }
						setIsAdding={ setIsAdding }
					/>
				</Modal>
			) }
		</>
	);
}
