/**
 * Internal dependencies
 */
import type { FilterOperatorMap } from '../../types';
import type { FieldType } from '../../types/private';
import { getOperatorByName } from '../../utils/operators';

export default function getFilter< Item >(
	fieldType: FieldType< Item >
): FilterOperatorMap< Item > {
	return fieldType.validOperators.reduce( ( accumulator, operator ) => {
		const operatorObj = getOperatorByName( operator );
		if ( operatorObj?.filter ) {
			accumulator[ operator ] = operatorObj.filter;
		}
		return accumulator;
	}, {} as FilterOperatorMap< Item > );
}
