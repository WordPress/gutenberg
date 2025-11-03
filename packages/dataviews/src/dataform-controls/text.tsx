/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import ValidatedText from './utils/validated-input';

export default function Text< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	config,
	validity,
}: DataFormControlProps< Item > ) {
	const { prefix, suffix } = config || {};

	return (
		<ValidatedText
			{ ...{
				data,
				field,
				onChange,
				hideLabelFromVision,
				validity,
				prefix: prefix ? createElement( prefix ) : undefined,
				suffix: suffix ? createElement( suffix ) : undefined,
			} }
		/>
	);
}
