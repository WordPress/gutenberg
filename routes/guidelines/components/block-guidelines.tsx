import {
	Button,
	Icon as WCIcon,
	Notice,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalConfirmDialog as ConfirmDialog,
	type IconType,
} from '@wordpress/components';
import {
	DataViews,
	filterSortAndPaginate,
	type Field,
	type View,
} from '@wordpress/dataviews';
import { __, sprintf } from '@wordpress/i18n';
import {
	useEffect,
	useMemo,
	useRef,
	useState,
	useCallback,
} from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { blockDefault } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
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
	// Default (non-compact) density: its 48px media tile gives block icons
	// padding around the canonical 24px render, without shrinking the icon
	// (which would crop icons that lack a viewBox, e.g. core/icon).
};

interface DataRow {
	id: string;
	label: string;
	guidelines: string;
	icon?: IconType;
}

const fields: Field< DataRow >[] = [
	{
		id: 'icon',
		label: __( 'Icon' ),
		type: 'media' as const,
		// No `size` prop: block icons render at their native 24px, matching the
		// editor's `.block-editor-block-icon`. That keeps viewBox-less icons
		// (e.g. core/icon) centered and uncropped. Painted and clamped in
		// block-guidelines.scss.
		render: ( { item } ) => (
			<div className="block-guidelines__icon">
				<WCIcon icon={ item.icon ?? blockDefault } />
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

	const addButtonRef = useRef< HTMLButtonElement >( null );
	const [ shouldFocusAddButton, setShouldFocusAddButton ] = useState( false );

	const rows = useMemo(
		() =>
			contentBlocks
				.filter( ( block ) => bySlug[ blockSlug( block.name ) ] )
				.map( ( block ) => ( {
					id: block.name,
					label: block.title,
					guidelines:
						bySlug[ blockSlug( block.name ) ]?.content ?? '',
					/* Block registry icons are renderable by `Icon`, but the
					   registry types do not model them. */
					icon: block.icon?.src as IconType | undefined,
				} ) ),
		[ contentBlocks, bySlug ]
	);

	const handleRowClick = useCallback(
		( id: string ) => {
			setSelectedItem( id );
			setIsOpen( true );
		},
		[ setSelectedItem, setIsOpen ]
	);

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
		[ setItemToDelete, handleRowClick ]
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
				createSuccessNotice( __( 'Guideline removed.' ), {
					type: 'snackbar',
				} );
				setShouldFocusAddButton( true );
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
		if ( shouldFocusAddButton ) {
			addButtonRef.current?.focus();
			setShouldFocusAddButton( false );
		}
	}, [ shouldFocusAddButton ] );

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
			<HStack alignment="right">
				<Button
					ref={ addButtonRef }
					variant="primary"
					onClick={ openModal }
					__next40pxDefaultSize
				>
					{ __( 'Add' ) }
				</Button>
			</HStack>

			{ isOpen && (
				<BlockGuidelineModal
					closeModal={ closeModal }
					initialBlock={ selectedItem }
					contentBlocks={ contentBlocks }
					bySlug={ bySlug }
					query={ query }
					onRemoved={ () => setShouldFocusAddButton( true ) }
				/>
			) }
			<ConfirmDialog
				isOpen={ !! itemToDelete }
				title={ __( 'Remove block guideline' ) }
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
						'You are about to remove the block guideline for the %s block.'
					),
					itemToDelete?.label ?? ''
				) }
			</ConfirmDialog>
		</VStack>
	);
}
