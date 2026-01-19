/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import { DataViewsPicker, filterSortAndPaginate } from '@wordpress/dataviews';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

// temporary import of icon data until API integration is done
import allIcons from '../../icons/icon-api-results.json';
import { parseIcon } from '../../utils';

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

// Use a subset of data for the picker example (first 10 items)
const data = allIcons.slice( 0, 50 );

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
			previewSize: 150,
		},
	} );

	const [ selection, setSelection ] = useState( [] );

	const { data: processedData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );

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
				itemListLabel="Galactic Bodies"
				onChangeSelection={ setSelection }
				onChangeView={ setView }
				paginationInfo={ paginationInfo }
				selection={ selection }
				view={ view }
			/>
		</Modal>
	);
};

export default InserterModal;
