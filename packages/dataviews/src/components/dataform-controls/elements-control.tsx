/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../../types';
import useElements from '../../hooks/use-elements';
import Combobox from './combobox';
import Select from './select';

const ELEMENTS_THRESHOLD = 10;

export default function ElementsControl< Item >(
	props: DataFormControlProps< Item >
) {
	const { field } = props;
	const { elements, paginationInfo } = useElements( {
		elements: field.elements,
		getElements: field.getElements,
	} );
	const totalItems = paginationInfo?.totalItems || elements.length;
	if ( totalItems >= ELEMENTS_THRESHOLD ) {
		return <Combobox { ...props } />;
	}
	return <Select { ...props } />;
}
