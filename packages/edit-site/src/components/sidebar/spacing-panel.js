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
		supports.includes( 'paddingBottom' )
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
	getStyleProperty,
	setStyleProperty,
} ) {
	const units = useCustomUnits( { contextName: name } );
	const paddingValues = {
		top: getStyleProperty( name, 'paddingTop' ),
		right: getStyleProperty( name, 'paddingRight' ),
		bottom: getStyleProperty( name, 'paddingBottom' ),
		left: getStyleProperty( name, 'paddingLeft' ),
	};
	const setPaddingValues = ( { top, right, bottom, left } ) => {
		setStyleProperty( name, 'paddingTop', top );
		setStyleProperty( name, 'paddingRight', right );
		setStyleProperty( name, 'paddingBottom', bottom );
		setStyleProperty( name, 'paddingLeft', left );
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
