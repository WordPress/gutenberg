/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	RadioControl,
} from '@wordpress/components';

const TERM_SELECTION_OPTIONS = [
	{
		label: __( 'All terms' ),
		value: 'all',
	},
	{
		label: __( 'Show only top level terms' ),
		value: 'top-level',
	},
	// {
	// 	label: __( 'Selected terms only' ),
	// 	value: 'include',
	// },
	// {
	// 	label: __( 'All terms except' ),
	// 	value: 'exclude',
	// },
];

export default function TermSelectionControl( {
	termsSelection,
	setAttributes,
	setQuery,
} ) {
	const currentValue = termsSelection || 'all';

	return (
		<ToolsPanelItem
			hasValue={ () => currentValue !== 'all' }
			label={ __( 'Term Selection' ) }
			onDeselect={ () => setAttributes( { termsSelection: 'all' } ) }
			isShownByDefault
		>
			<RadioControl
				label={ __( 'Term Selection' ) }
				help={ __( 'Choose which terms to display.' ) }
				selected={ currentValue }
				options={ TERM_SELECTION_OPTIONS }
				onChange={ ( value ) => {
					// Update the main termsSelection attribute
					setAttributes( { termsSelection: value } );

					// Reset related fields in termQuery when changing selection type
					switch ( value ) {
						case 'all':
							setQuery( {
								parent: undefined,
								include: [],
								exclude: [],
							} );
							break;
						case 'top-level':
							setQuery( {
								parent: 0,
								hierarchical: false,
							} );
							break;
					}
				} }
			/>
		</ToolsPanelItem>
	);
}
