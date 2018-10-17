/**
 * Internal dependencies
 */
import MetaBoxTitles from '../meta-box-titles';
import MetaBoxVisibility from './meta-box-visibility';

function MetaBoxesVisibility() {
	return (
		<MetaBoxTitles
			titleWrapper={ ( title, id ) => (
				<MetaBoxVisibility id={ id } />
			) }
		/>
	);
}

export default MetaBoxesVisibility;
