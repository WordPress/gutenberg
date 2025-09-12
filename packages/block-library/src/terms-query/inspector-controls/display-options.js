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

const allTermsQuery = {
	include: [],
	exclude: [],
	parent: false,
};

const topLevelTermsQuery = {
	include: [],
	exclude: [],
	parent: 0,
	hierarchical: false,
};

const getQueryAttributes = ( value ) => {
	if ( value === 'all' ) {
		return allTermsQuery;
	}
	if ( value === 'top-level' ) {
		return topLevelTermsQuery;
	}
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
					const queryAttributes = getQueryAttributes( value );
					setAttributes( {
						termsToShow: value,
						termQuery: { ...termQuery, ...queryAttributes },
					} );
				} }
			/>
		</ToolsPanelItem>
	);
}
