import type { Field } from '../../types';
import type { FieldType } from '../../types/private';

function getFormat< Item >(
	field: Field< Item >,
	fieldType: FieldType< Item >
) {
	return {
		...fieldType.format,
		...field.format,
	};
}

export default getFormat;
