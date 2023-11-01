/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViewItem from './dataview-item';
import AddNewItem from './add-new-view';

const EMPTY_ARRAY = [];

function CustomDataViewItem( { dataviewId, isActive } ) {
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
	const type = useMemo( () => {
		const viewContent = JSON.parse( dataview.content );
		return viewContent.type;
	}, [ dataview.content ] );
	return (
		<DataViewItem
			title={ dataview.title }
			type={ type }
			isActive={ isActive }
			isCustom="true"
			customViewId={ dataviewId }
		/>
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
		<ItemGroup>
			{ customDataViews.map( ( customViewRecord ) => {
				return (
					<CustomDataViewItem
						key={ customViewRecord.id }
						dataviewId={ customViewRecord.id }
						isActive={
							isCustom === 'true' &&
							Number( activeView ) === customViewRecord.id
						}
					/>
				);
			} ) }
			<AddNewItem type={ type } />
		</ItemGroup>
	);
}
