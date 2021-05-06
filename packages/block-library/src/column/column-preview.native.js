/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { useConvertUnitToMobile } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './editor.scss';

function ColumnPreviewItem( { index, selectedColumnIndex, width } ) {
	const columnIndicatorStyle = usePreferredColorSchemeStyle(
		styles.columnIndicator,
		styles.columnIndicatorDark
	);

	const isSelectedColumn = index === selectedColumnIndex;

	const convertedWidth = useConvertUnitToMobile( width );
	return (
		<View
			style={ [
				isSelectedColumn && columnIndicatorStyle,
				{ flex: convertedWidth },
			] }
			key={ index }
		/>
	);
}

function ColumnsPreview( { columnWidths, selectedColumnIndex } ) {
	const columnsPreviewStyle = usePreferredColorSchemeStyle(
		styles.columnsPreview,
		styles.columnsPreviewDark
	);
	return (
		<View style={ columnsPreviewStyle }>
			{ columnWidths.map( ( width, index ) => {
				return (
					<ColumnPreviewItem
						index={ index }
						selectedColumnIndex={ selectedColumnIndex }
						width={ width }
						key={ index }
					/>
				);
			} ) }
		</View>
	);
}

export default ColumnsPreview;
