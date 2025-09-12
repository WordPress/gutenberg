/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	RadioControl,
} from '@wordpress/components';

const getOptions = ( displayTopLevelControl, displaySubtermsControl ) => {
	const options = [ { label: __( 'Show all' ), value: 'all' } ];

	if ( displayTopLevelControl ) {
		options.push( {
			label: __( 'Show only top level terms' ),
			value: 'top-level',
		} );
	}

	if ( displaySubtermsControl ) {
		options.push( {
			label: __( 'Show subterms only' ),
			value: 'subterms',
		} );
	}

	return options;
};

export default function DisplayOptions( {
	attributes,
	displayTopLevelControl,
	displaySubtermsControl,
	setAttributes,
} ) {
	const { termQuery, termsToShow } = attributes;

	return (
		<ToolsPanelItem
			hasValue={ () => termsToShow !== 'all' }
			label={ __( 'Terms to show' ) }
			onDeselect={ () => setAttributes( { termsToShow: 'all' } ) }
			isShownByDefault
		>
			<RadioControl
				__nextHasNoMarginBottom
				label={ __( 'Terms to show' ) }
				options={ getOptions(
					displayTopLevelControl,
					displaySubtermsControl
				) }
				selected={ termsToShow }
				onChange={ ( value ) => {
					setAttributes( { termsToShow: value } );
				} }
				disabled={ !! termQuery.hierarchical }
			/>
		</ToolsPanelItem>
	);
}
