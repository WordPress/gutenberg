/**
 * WordPress dependencies
 */
import {
	Button,
	Icon as WCIcon,
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
import { useDispatch } from '@wordpress/data';
import { blockDefault } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import BlockGuidelineModal from './block-guideline-modal';
import { blockSlug, deleteGuidelineRow } from '../data';
import type { ContentBlock, GuidelineRow, GuidelineQuery } from '../types';
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
				<WCIcon icon={ item.icon ?? blockDefault } size={ 16 } />
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

interface BlockGuidelinesProps {
	contentBlocks: ContentBlock[];
	bySlug: Record< string, GuidelineRow >;
	query: GuidelineQuery;
}

export default function BlockGuidelines( {
	contentBlocks,
	bySlug,
	query,
}: BlockGuidelinesProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ view, setView ] = useState< View >( initialView );
	const [ selectedItem, setSelectedItem ] = useState< string >();
	const [ error, setError ] = useState< string | null >( null );
	const [ busy, setBusy ] = useState( false );
	const [ itemToDelete, setItemToDelete ] = useState< DataRow | null >(
		null
	);
	const { createSuccessNotice } = useDispatch( noticesStore );

	const rows = useMemo(
		() =>
			contentBlocks
				.filter( ( block ) => bySlug[ blockSlug( block.name ) ] )
				.map( ( block ) => ( {
					id: block.name,
					label: block.title,
					guidelines:
						bySlug[ blockSlug( block.name ) ]?.content ?? '',
					icon: block.icon?.src,
				} ) ),
		[ contentBlocks, bySlug ]
	);

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
					handleRowClick( items[ 0 ].id );
				},
			},
			{
				id: 'remove',
				label: __( 'Remove' ),
				callback: ( items: DataRow[] ) => {
					setItemToDelete( items[ 0 ] );
				},
			},
		],
		[ setItemToDelete ]
	);

	const handleDelete = () => {
		if ( ! itemToDelete ) {
			return;
		}
		const row = bySlug[ blockSlug( itemToDelete.id ) ];
		if ( ! row ) {
			setItemToDelete( null );
			return;
		}
		setBusy( true );
		deleteGuidelineRow( row.id )
			.then( () => {
				setError( null );
				createSuccessNotice( __( 'Guidelines removed.' ), {
					type: 'snackbar',
				} );
			} )
			.catch( ( e: Error ) => setError( e.message ) )
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
						handleRowClick( items[ 0 ] );
					} }
					defaultLayouts={ {
						list: true,
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
				<Button
					variant="primary"
					onClick={ openModal }
					__next40pxDefaultSize
				>
					{ __( 'Add guidelines' ) }
				</Button>
			</HStack>

			{ isOpen && (
				<BlockGuidelineModal
					closeModal={ closeModal }
					initialBlock={ selectedItem }
					contentBlocks={ contentBlocks }
					bySlug={ bySlug }
					query={ query }
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
						'You are about to remove the block guidelines for the %s block.'
					),
					itemToDelete?.label ?? ''
				) }
			</ConfirmDialog>
		</VStack>
	);
}
