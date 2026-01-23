/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockQuickNavigation from '../block-quick-navigation';

const ContentTab = ( { contentClientIds, onBlockSelect } ) => {
	if ( ! contentClientIds || contentClientIds.length === 0 ) {
		return null;
	}

	const shouldShowBlockFields =
		window?.__experimentalContentOnlyInspectorFields;

	return (
		<>
			{ ! shouldShowBlockFields && (
				<PanelBody title={ __( 'Content' ) }>
					<BlockQuickNavigation
						clientIds={ contentClientIds }
						onSelect={ onBlockSelect }
					/>
				</PanelBody>
			) }
		</>
	);
};

export default ContentTab;
