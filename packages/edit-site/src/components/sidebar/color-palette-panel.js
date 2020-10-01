/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalColorEdit as ColorEdit,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default ( { contextName, getSetting, setSetting } ) => {
	const colors = getSetting( contextName, 'color.palette' );
	let emptyUI;
	if ( colors === undefined ) {
		emptyUI = __(
			'Using theme or core default colors. Add some colors to create your own color palette instead.'
		);
	} else if ( colors && colors.length === 0 ) {
		emptyUI = (
			<>
				<p>{ __( 'Using an empty color palette.' ) }</p>
				<Button
					isSmall
					isSecondary
					onClick={ () => setSetting( contextName, 'color.palette' ) }
				>
					{ __( 'Reset to theme/core defaults' ) }
				</Button>
			</>
		);
	}
	return (
		<ColorEdit
			colors={ colors }
			onChange={ ( newColors ) => {
				setSetting( contextName, 'color.palette', newColors );
			} }
			emptyUI={ emptyUI }
		/>
	);
};
