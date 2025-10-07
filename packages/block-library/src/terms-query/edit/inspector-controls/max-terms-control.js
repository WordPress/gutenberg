/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	RangeControl,
} from '@wordpress/components';

export default function MaxTermsControl( { attributes, setQuery } ) {
	const { termQuery } = attributes;

	return (
		<ToolsPanelItem
			hasValue={ () => termQuery.perPage !== 10 }
			label={ __( 'Max terms' ) }
			onDeselect={ () => setQuery( { perPage: 10 } ) }
			isShownByDefault
		>
			<RangeControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'Max terms' ) }
				value={ termQuery.perPage }
				min={ 0 }
				max={ 100 }
				onChange={ ( perPage ) => {
					setQuery( { perPage } );
				} }
				help={ __(
					'Limit the number of terms you want to show. To show all terms, use 0 (zero).'
				) }
			/>
		</ToolsPanelItem>
	);
}
