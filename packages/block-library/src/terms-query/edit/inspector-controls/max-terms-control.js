/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RangeControl } from '@wordpress/components';

export default function MaxTermsControl( { value, onChange, ...props } ) {
	return (
		<RangeControl
			__next40pxDefaultSize
			value={ value }
			min={ 0 }
			max={ 100 }
			onChange={ onChange }
			help={ __(
				'Limit the number of terms you want to show. To show all terms, use 0 (zero).'
			) }
			{ ...props }
		/>
	);
}
