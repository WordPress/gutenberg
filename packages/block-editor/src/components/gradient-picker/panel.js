/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import GradientPicker from './control';
import useSetting from '../use-setting';
import { __experimentalGetHighestPriorityPreset } from '../../utils';

export default function GradientPanel( props ) {
	const gradients = __experimentalGetHighestPriorityPreset(
		useSetting( 'color.gradients' )
	);
	if ( isEmpty( gradients ) ) {
		return null;
	}
	return (
		<PanelBody title={ __( 'Gradient' ) }>
			<GradientPicker { ...props } />
		</PanelBody>
	);
}
