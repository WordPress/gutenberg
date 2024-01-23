/**
 * WordPress dependencies
 */
import warning from '@wordpress/warning';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import groups from './groups';

export default function InspectorControlsSlot( {
	__experimentalGroup,
	group = 'default',
	...props
} ) {
	if ( __experimentalGroup ) {
		deprecated(
			'`__experimentalGroup` property in `InspectorControlsSlot`',
			{
				since: '6.2',
				version: '6.4',
				alternative: '`group`',
			}
		);
		group = __experimentalGroup;
	}
	const Slot = groups[ group ]?.Slot;
	if ( ! Slot ) {
		warning( `Unknown InspectorControls group "${ group }" provided.` );
		return null;
	}

	return <Slot { ...props } />;
}
