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
import getIcons from '../../icons';

const fields = [
	{
		id: 'icon',
		label: 'Icon',
		render: ( { item } ) => <>{ parseIcon( item.content ) }</>,
		type: 'media',
		enableHiding: false,
	},
	{
		id: 'label',
		label: 'Label',
		enableGlobalSearch: true,
		enableHiding: false,
		enableSorting: true,
		filterBy: false,
		isValid: {
			required: true,
		},
		type: 'text',
	},
];

const InserterModal = ( {
	isInserterOpen,
	setInserterOpen,
	attributes,
	setAttributes,
} ) => {
	const [ view, setView ] = useState( {
		fields: [ 'slug' ],
		filters: [],
		groupByField: undefined,
		infiniteScrollEnabled: undefined,
		mediaField: 'icon',
		titleField: 'label',
		descriptionField: '',
		page: 1,
		perPage: 50,
		search: '',
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

	const [ selection, setSelection ] = useState(
		[ attributes.icon ].filter( Boolean )
	);

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
					icon: selectedItems[ 0 ]?.name || '',
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
				searchLabel={ __( 'Search icons' ) }
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
