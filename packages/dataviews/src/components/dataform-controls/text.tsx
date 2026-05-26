/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../../types';
import ValidatedText from './utils/validated-input';

export default function Text< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	config,
	validity,
}: DataFormControlProps< Item > ) {
	const { prefix, suffix } = config || {};
	const isConnected = field.id in ( data?.metadata?.bindings || {} );

	return (
		<ValidatedText
			{ ...{
				data,
				field,
				onChange,
				hideLabelFromVision,
				markWhenOptional,
				validity,
				prefix: prefix
					? createElement( prefix, { isConnected } )
					: undefined,
				suffix: suffix
					? createElement( suffix, { isConnected } )
					: undefined,
			} }
		/>
	);
}
