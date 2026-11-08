import { __experimentalNumberControl as NumberControl } from '@wordpress/components';
import { _x } from '@wordpress/i18n';

const MIN_OFFSET = 0;
const MAX_OFFSET = 100;

export const OffsetControl = ( { offset = 0, onChange } ) => {
	return (
		<NumberControl
			label={ _x( 'Offset', 'Number of posts to skip in a query' ) }
			value={ offset }
			min={ MIN_OFFSET }
			onChange={ ( newOffset ) => {
				if (
					isNaN( newOffset ) ||
					newOffset < MIN_OFFSET ||
					newOffset > MAX_OFFSET
				) {
					return;
				}
				onChange( { offset: newOffset } );
			} }
		/>
	);
};

export default OffsetControl;
