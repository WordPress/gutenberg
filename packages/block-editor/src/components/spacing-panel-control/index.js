/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import InspectorControls from '../inspector-controls';

export default function SpacingPanelControl( { children, ...props } ) {
	const isSpacingEnabled = useSelect( ( select ) => {
		const { getSettings } = select( 'core/block-editor' );
		return get( getSettings(), '__experimentalEnableCustomSpacing' );
	}, [] );

	if ( ! isSpacingEnabled ) return null;

	return (
		<InspectorControls { ...props }>
			<PanelBody title={ __( 'Spacing' ) }>{ children }</PanelBody>
		</InspectorControls>
	);
}
