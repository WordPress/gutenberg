/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './editor.scss';

function ColumnsPreview( { columnWidths, selectedColumnIndex } ) {
	const columnsPreviewStyle = usePreferredColorSchemeStyle(
		styles.columnsPreview,
		styles.columnsPreviewDark
	);

	const columnIndicatorStyle = usePreferredColorSchemeStyle(
		styles.columnIndicator,
		styles.columnIndicatorDark
	);

	return (
		<View style={ columnsPreviewStyle }>
			{ columnWidths.map( ( width, index ) => {
				const isSelectedColumn = index === selectedColumnIndex;
				return (
					<View
						style={ [
							isSelectedColumn && columnIndicatorStyle,
							{ flex: width },
						] }
						key={ index }
					/>
				);
			} ) }
		</View>
	);
}

export default ColumnsPreview;
