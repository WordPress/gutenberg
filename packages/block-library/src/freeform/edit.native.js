/**
 * Internal dependencies
 */
import MissingEdit from '../missing/edit';

const ClassicEdit = ( props ) => (
	<MissingEdit
		{ ...props }
		attributes={ { ...props.attributes, originalName: props.name } }
	/>
);

export default ClassicEdit;
