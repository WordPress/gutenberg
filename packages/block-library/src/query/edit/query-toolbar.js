/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { usePatterns } from '../utils';

export default function QueryToolbar( {
	openPatternSelectionModal,
	name,
	clientId,
} ) {
	const hasPatterns = !! usePatterns( clientId, name ).length;

	return (
		<>
			{ hasPatterns && (
				<ToolbarGroup className="wp-block-template-part__block-control-group">
					<ToolbarButton onClick={ openPatternSelectionModal }>
						{ __( 'Replace' ) }
					</ToolbarButton>
				</ToolbarGroup>
			) }
		</>
	);
}
