/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalBoxControl as BoxControl,
	PanelBody,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useEditorFeature } from '../editor/utils';

export function useHasSpacingPanel( { supports, name } ) {
	return (
		useEditorFeature( 'spacing.customPadding', name ) &&
		supports.includes( 'padding' )
	);
}

function filterUnitsWithSettings( settings = [], units = [] ) {
	return units.filter( ( unit ) => {
		return settings.includes( unit.value );
	} );
}

function useCustomUnits( { units, contextName } ) {
	const availableUnits = useEditorFeature( 'spacing.units', contextName );
	const usedUnits = filterUnitsWithSettings(
		! availableUnits ? [] : availableUnits,
		units
	);

	return usedUnits.length === 0 ? false : usedUnits;
}

export default function SpacingPanel( {
	context: { name },
	getStyle,
	setStyle,
} ) {
	const units = useCustomUnits( { contextName: name } );
	const paddingValues = {
		top: getStyle( name, 'paddingTop' ),
		right: getStyle( name, 'paddingRight' ),
		bottom: getStyle( name, 'paddingBottom' ),
		left: getStyle( name, 'paddingLeft' ),
	};
	const setPaddingValues = ( { top, right, bottom, left } ) => {
		setStyle( name, 'paddingTop', top );
		setStyle( name, 'paddingRight', right );
		setStyle( name, 'paddingBottom', bottom );
		setStyle( name, 'paddingLeft', left );
	};
	return (
		<PanelBody title={ __( 'Spacing' ) }>
			<BoxControl
				values={ paddingValues }
				onChange={ setPaddingValues }
				label={ __( 'Padding' ) }
				units={ units }
			/>
		</PanelBody>
	);
}
