/* @jsxRuntime automatic */

/**
 * WordPress dependencies
 */
import {
	Button,
	Icon,
	Notice,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import {
	DataViews,
	filterSortAndPaginate,
	type View,
} from '@wordpress/dataviews';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { blockDefault } from '@wordpress/icons';
import { store as blocksStore } from '@wordpress/blocks';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import BlockGuidelineModal from './block-guideline-modal';
import { saveContentGuidelines } from '../api';
import { STORE_NAME } from '../store';
import './block-guidelines.scss';

const PER_PAGE = 5;

const initialView: View = {
	type: 'list',
	search: '',
	page: 1,
	perPage: PER_PAGE,
	filters: [],
	mediaField: 'icon',
	showMedia: true,
	titleField: 'label',
	layout: {
		density: 'compact',
	},
};

interface DataRow {
	id: string;
	label: string;
}

const fields = [
	{
		id: 'icon',
		label: __( 'Icon' ),
		type: 'media' as const,
		render: ( { item } ) => (
			<div className="block-guidelines__icon">
				<Icon icon={ item.icon ?? blockDefault } size={ 16 } />
			</div>
		),
	},
	{
		id: 'label',
		label: __( 'Label' ),
		type: 'text' as const,
		enableGlobalSearch: true,
		getValue: ( { item } ) => item.label,
		render: ( { item } ) => item.label,
	},
];

export default function BlockGuidelines() {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ view, setView ] = useState< View >( initialView );
	const [ selectedItem, setSelectedItem ] = useState< string >();
	const [ error, setError ] = useState< string | null >( null );
	const [ busy, setBusy ] = useState( false );
	const [ itemToDelete, setItemToDelete ] = useState< DataRow | null >(
		null
	);
	const { createSuccessNotice } = useDispatch( noticesStore );

	const blockGuidelines = useSelect(
		// @ts-ignore
		( select ) => select( STORE_NAME ).getBlockGuidelines(),
		[]
	);

	const blockTypes = useSelect(
		// @ts-ignore
		( select ) => select( blocksStore ).getBlockTypes(),
		[]
	);

	const rows = useMemo(
		() =>
			blockTypes
				.filter( ( blockType ) => blockGuidelines[ blockType.name ] )
				.map( ( blockType ) => ( {
					id: blockType.name,
					label: blockType.title,
					guidelines: blockGuidelines[ blockType.name ] ?? '',
					icon: blockType.icon?.src,
				} ) ),
		[ blockGuidelines, blockTypes ]
	);

	const { setBlockGuideline } = useDispatch( STORE_NAME );

	const handleRowClick = ( id: string ) => {
		setSelectedItem( id );
		setIsOpen( true );
	};

	const actions = useMemo(
		() => [
			{
				id: 'edit',
				label: __( 'Edit' ),
				callback: ( items: DataRow[] ) => {
					const item = items[ 0 ];
					handleRowClick( item.id );
				},
			},
			{
				id: 'remove',
				label: __( 'Remove' ),
				callback: ( items: DataRow[] ) => {
					const item = items[ 0 ];
					setItemToDelete( item );
				},
			},
		],
		[ setItemToDelete ]
	);

	const handleDelete = () => {
		if ( ! itemToDelete ) {
			return;
		}
		const oldValue = blockGuidelines[ itemToDelete.id ];
		// We need to pass an empty string to remove the guideline.
		// This is because the API will only remove the guideline if the value is an empty string.
		setBlockGuideline( itemToDelete.id, '' );
		setBusy( true );
		saveContentGuidelines()
			.then( () => {
				setError( null );
				createSuccessNotice( __( 'Guidelines removed.' ), {
					type: 'snackbar',
				} );
			} )
			.catch( ( e: Error ) => {
				setError( e.message );
				setBlockGuideline( itemToDelete.id, oldValue );
			} )
			.finally( () => {
				setBusy( false );
				setItemToDelete( null );
			} );
	};

	const { data: processedData, paginationInfo } = useMemo(
		() => filterSortAndPaginate( rows, view, fields ),
		[ rows, view ]
	);

	useEffect( () => {
		const lastPage = Math.max( paginationInfo.totalPages, 1 );

		if ( view.page && view.page > lastPage ) {
			setView( ( currentView ) =>
				currentView.page && currentView.page > lastPage
					? {
							...currentView,
							page: lastPage,
					  }
					: currentView
			);
		}
	}, [ paginationInfo.totalPages, view.page ] );

	const closeModal = () => {
		setIsOpen( false );
		setSelectedItem( undefined );
	};

	const openModal = () => {
		setSelectedItem( undefined );
		setIsOpen( true );
	};

	const shouldShowDataViewControls = rows.length > PER_PAGE;

	return (
		<VStack spacing={ 4 } className="block-guidelines">
			{ error && (
				<Notice status="error" onRemove={ () => setError( null ) }>
					{ sprintf(
						/* translators: %s: Error message. */
						__( 'Error: %s' ),
						error
					) }
				</Notice>
			) }
			{ rows.length > 0 && (
				<DataViews
					paginationInfo={ paginationInfo }
					data={ processedData }
					view={ view }
					onChangeView={ setView }
					fields={ fields }
					actions={ actions }
					config={ { perPageSizes: [ PER_PAGE ] } }
					onChangeSelection={ ( items ) => {
						const id = items[ 0 ];
						handleRowClick( id );
					} }
					defaultLayouts={ {
						list: {},
					} }
				>
					<VStack spacing={ 4 }>
						{ shouldShowDataViewControls && (
							<DataViews.Search label={ __( 'Search blocks' ) } />
						) }
						<DataViews.Layout />
						{ shouldShowDataViewControls && <DataViews.Footer /> }
					</VStack>
				</DataViews>
			) }
			<HStack>
				<Button variant="primary" onClick={ openModal }>
					{ __( 'Add guidelines' ) }
				</Button>
			</HStack>

			{ isOpen && (
				<BlockGuidelineModal
					closeModal={ closeModal }
					initialBlock={ selectedItem }
				/>
			) }
			<ConfirmDialog
				isOpen={ !! itemToDelete }
				title={ __( 'Remove block guidelines' ) }
				__experimentalHideHeader={ false }
				onConfirm={ handleDelete }
				onCancel={ () => setItemToDelete( null ) }
				confirmButtonText={ __( 'Remove' ) }
				isBusy={ busy }
				size="small"
			>
				{ sprintf(
					/* translators: %s: Block name. */
					__(
						'You are about to remove the block guidelines for the %s block. This can be undone from revision history.'
					),
					itemToDelete?.label ?? ''
				) }
			</ConfirmDialog>
		</VStack>
	);
}
