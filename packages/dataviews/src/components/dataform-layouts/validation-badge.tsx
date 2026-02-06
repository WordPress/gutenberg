/**
 * WordPress dependencies
 */
import { Icon, Tooltip } from '@wordpress/components';
import { error as errorIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { FieldValidity } from '../../types';

function getFirstValidationError(
	validity: FieldValidity | undefined
): string | undefined {
	if ( ! validity ) {
		return undefined;
	}

	const validityRules = Object.keys( validity ).filter(
		( key ) => key !== 'children'
	);

	for ( const key of validityRules ) {
		const rule = validity[ key as keyof Omit< FieldValidity, 'children' > ];
		if ( rule === undefined ) {
			continue;
		}

		if ( rule.type === 'invalid' ) {
			if ( rule.message ) {
				return rule.message;
			}

			if ( key === 'required' ) {
				return 'A required field is empty';
			}

			return 'Unidentified validation error';
		}
	}

	if ( validity.children ) {
		for ( const childValidity of Object.values( validity.children ) ) {
			const childError = getFirstValidationError( childValidity );
			if ( childError ) {
				return childError;
			}
		}
	}

	return undefined;
}

interface ValidationBadgeProps {
	validity?: FieldValidity;
}

export default function ValidationBadge( { validity }: ValidationBadgeProps ) {
	const errorMessage = getFirstValidationError( validity );

	if ( ! errorMessage ) {
		return null;
	}

	return (
		<Tooltip text={ errorMessage }>
			<span className="dataforms-layouts__validation-badge">
				<Icon icon={ errorIcon } size={ 24 } />
			</span>
		</Tooltip>
	);
}
