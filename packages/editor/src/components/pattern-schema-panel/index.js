/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { PatternSchemaQuickNavigation } = unlock( patternsPrivateApis );

export default function PatternSchemaPanel() {
	const supportsPatternSchema = useSelect(
		( select ) => select( editorStore ).getCurrentPostType() === 'wp_block',
		[]
	);

	if ( ! supportsPatternSchema ) {
		return null;
	}

	return (
		<PanelBody title={ __( 'Content' ) }>
			<PatternSchemaQuickNavigation />
		</PanelBody>
	);
}
