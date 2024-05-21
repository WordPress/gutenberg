/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import groups from '../inspector-controls/groups';

export default function AdvancedControls( props ) {
	const Slot = groups.advanced?.Slot;
	if ( ! Slot ) {
		return null;
	}

	return (
		<Slot { ...props }>
			{ ( fills ) => {
				if ( ! fills.length ) {
					return null;
				}

				return (
					<PanelBody title={ __( 'Advanced' ) }>{ fills }</PanelBody>
				);
			} }
		</Slot>
	);
}
