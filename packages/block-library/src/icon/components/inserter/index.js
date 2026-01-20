/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';
import { DataViewsPicker, filterSortAndPaginate } from '@wordpress/dataviews';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { parseIcon } from '../../utils';

/**
 * Mock function to simulate fetching icons from an API.
 * @return {Promise<Array>} A promise that resolves to an array of icon data.
 */
const getIcons = async () => {
	// Dynamically import the icon data
	const { default: allIcons } = await import(
		'../../icons/icon-api-results.json'
	);

	// Return a new Promise that resolves after a delay
	return new Promise( ( resolve ) => {
		setTimeout( () => {
			resolve( allIcons ); // Resolve with the mock data
		}, 1000 ); // Simulate a 1-second network delay
	} );
};

const fields = [
	{
		id: 'icon',
		label: 'Icon',
		render: ( { item } ) => <>{ parseIcon( item.content ) }</>,
		type: 'media',
	},
	{
		id: 'name',
		label: 'Name',
		enableGlobalSearch: true,
		enableHiding: false,
		enableSorting: false,
		filterBy: false,
		isValid: {
			required: true,
		},
		type: 'text',
		render: ( { item } ) =>
			item.name
				.split( '/' )[ 1 ]
				.replaceAll( '-', ' ' )
				.replace( /^./, ( char ) => char.toUpperCase() ),
	},
];

const InserterModal = ( {
	isInserterOpen,
	setInserterOpen,
	setAttributes,
} ) => {
	const [ view, setView ] = useState( {
		fields: [],
		filters: [],
		groupByField: undefined,
		infiniteScrollEnabled: undefined,
		mediaField: 'icon',
		page: 1,
		perPage: 50,
		search: '',
		titleField: 'name',
		descriptionField: '',
		type: 'pickerGrid',
		layout: {
			previewSize: 100,
		},
	} );

	const [ icons, setIcons ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( true );

	useEffect( () => {
		if ( isInserterOpen ) {
			// This will be replaced with an actual API call later.
			const requestIcons = async () => {
				const iconList = await getIcons();
				setIcons( iconList );
				setIsLoading( false );
			};
			requestIcons();
		}
	}, [ isInserterOpen ] );

	const [ selection, setSelection ] = useState( [] );

	const { data: processedData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( icons, view, fields );
	}, [ icons, view ] );

	const actions = [
		{
			callback: () => {
				setSelection( [] );
			},
			id: 'cancel',
			label: 'Cancel',
			supportsBulk: false,
		},
		{
			callback: ( items ) => {
				const selectedItems = Array.isArray( items )
					? items
					: [ items ];
				setAttributes( {
					icon: selectedItems[ 0 ]?.content || '',
					iconName: selectedItems[ 0 ]?.name || '',
				} );
				setInserterOpen( false );
			},
			id: 'confirm',
			isPrimary: true,
			label: 'Confirm',
			supportsBulk: false,
		},
	];

	// Only render the modal if it's open.
	if ( ! isInserterOpen ) {
		return null;
	}

	return (
		<Modal
			className="wp-block-outermost-icon-inserter__modal"
			title={ __( 'Icon Library' ) }
			onRequestClose={ () => setInserterOpen( false ) }
			isFullScreen
		>
			<DataViewsPicker
				actions={ actions }
				config={ {
					perPageSizes: [ 10, 25, 50, 100 ],
				} }
				data={ processedData }
				defaultLayouts={ {
					pickerGrid: {},
				} }
				fields={ fields }
				getItemId={ ( item ) => item.name.toString() }
				onChangeSelection={ setSelection }
				onChangeView={ setView }
				paginationInfo={ paginationInfo }
				selection={ selection }
				view={ view }
				isLoading={ isLoading }
			/>
		</Modal>
	);
};

export default InserterModal;
