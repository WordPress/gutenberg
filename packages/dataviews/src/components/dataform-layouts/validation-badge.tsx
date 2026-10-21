import { Badge } from '@wordpress/ui';
import type { FieldValidity } from '../../types';
import getValidationMessage from './get-validation-message';

export default function ValidationBadge( {
	validity,
}: {
	validity: FieldValidity | undefined;
} ) {
	const message = getValidationMessage( validity );

	if ( ! message ) {
		return null;
	}

	return <Badge intent="high">{ message }</Badge>;
}
