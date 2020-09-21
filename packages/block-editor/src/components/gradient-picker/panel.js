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
import useEditorFeature from '../use-editor-feature';

export default function GradientPanel( props ) {
	const gradients = useEditorFeature( 'color.gradients' );
	if ( isEmpty( gradients ) ) {
		return null;
	}
	return (
		<PanelBody title={ __( 'Gradient' ) }>
			<GradientPicker { ...props } />
		</PanelBody>
	);
}
