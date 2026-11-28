import { createElement } from '@wordpress/element';
import { InputLayout } from '@wordpress/ui';
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
	const { prefix, prefixPadding, suffix, suffixPadding } = config || {};

	return (
		<ValidatedText
			{ ...{
				data,
				field,
				onChange,
				hideLabelFromVision,
				markWhenOptional,
				validity,
				prefix: prefix ? (
					<InputLayout.Slot padding={ prefixPadding }>
						{ typeof prefix === 'string'
							? prefix
							: createElement( prefix ) }
					</InputLayout.Slot>
				) : undefined,
				suffix: suffix ? (
					<InputLayout.Slot padding={ suffixPadding }>
						{ typeof suffix === 'string'
							? suffix
							: createElement( suffix ) }
					</InputLayout.Slot>
				) : undefined,
			} }
		/>
	);
}
