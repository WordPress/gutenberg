/* @jsx createElement */

/**
 * WordPress dependencies
 */
import {
	Button,
	Icon,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { Notice } from '@wordpress/ui';
import {
	DataViews,
	filterSortAndPaginate,
	type View,
} from '@wordpress/dataviews';
import { __, sprintf } from '@wordpress/i18n';
import { createElement, useMemo, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { blockDefault } from '@wordpress/icons';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import BlockGuidelineModal from './block-guideline-modal';
import { saveContentGuidelines } from '../api';
import { STORE_NAME } from '../store';
import './block-guidelines.scss';

const initialView: View = {
	type: 'list',
	search: '',
	page: 1,
	perPage: 5,
	filters: [],
	mediaField: 'icon',
	showMedia: true,
	titleField: 'label',
	layout: {
		density: 'compact',
	},
};

const fields = [
	{
		id: 'icon',
		label: __( 'Icon' ),
		type: 'media' as const,
		render: ( { item } ) => (
			<Icon icon={ item.icon ?? blockDefault } size={ 16 } />
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

	const actions = useMemo(
		() => [
			{
				id: 'edit',
				label: __( 'Edit' ),
				callback: ( items ) => {
					const item = items[ 0 ];
					setSelectedItem( item.id );
					setIsOpen( true );
				},
			},
			{
				id: 'remove',
				label: __( 'Remove' ),
				callback: ( items ) => {
					const item = items[ 0 ];
					setBlockGuideline( item.id, '' );
					saveContentGuidelines()
						.then( () => setError( null ) )
						.catch( ( e: Error ) => setError( e.message ) );
				},
			},
		],
		[ setBlockGuideline ]
	);

	const { data: processedData, paginationInfo } = useMemo(
		() => filterSortAndPaginate( rows, view, fields ),
		[ rows, view ]
	);

	const closeModal = () => {
		setIsOpen( false );
		setSelectedItem( undefined );
	};

	const openModal = () => {
		setSelectedItem( undefined );
		setIsOpen( true );
	};

	const shouldShowDataViewControls = rows.length > 5;

	return (
		<VStack spacing={ 4 } className="block-guidelines">
			{ error && (
				<Notice.Root intent="error">
					<Notice.Title>
						{ sprintf(
							/* translators: %s: Error message. */
							__( 'Error: %s' ),
							error
						) }
					</Notice.Title>
				</Notice.Root>
			) }
			{ rows.length > 0 && (
				<DataViews
					paginationInfo={ paginationInfo }
					data={ processedData }
					view={ view }
					onChangeView={ setView }
					fields={ fields }
					actions={ actions }
					config={ { perPageSizes: [ 5, 10, 20, 50 ] } }
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
			<Button
				variant="primary"
				onClick={ openModal }
				className="block-guidelines__add-button"
			>
				{ __( 'Add block guidelines' ) }
			</Button>

			{ isOpen && (
				<BlockGuidelineModal
					closeModal={ closeModal }
					initialBlock={ selectedItem }
				/>
			) }
		</VStack>
	);
}
