/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalGrid as Grid } from '@wordpress/components';

function FontsGrid( { children, columns = 4 } ) {
	return (
		<Grid columns={ columns } gap={ 4 }>
			{ children }
		</Grid>
	);
}

export default FontsGrid;
