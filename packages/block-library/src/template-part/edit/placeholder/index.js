/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { Placeholder, Button } from '@wordpress/components';

export default function TemplatePartPlaceholder( {
	area,
	onOpenSelectionModal,
} ) {
	const { areaIcon, areaLabel } = useSelect(
		( select ) => {
			// FIXME: @wordpress/block-library should not depend on @wordpress/editor.
			// Blocks can be loaded into a *non-post* block editor.
			// eslint-disable-next-line @wordpress/data-no-store-string-literals
			const definedAreas = select(
				'core/editor'
			).__experimentalGetDefaultTemplatePartAreas();

			const selectedArea = find( definedAreas, { area } );
			const defaultArea = find( definedAreas, { area: 'uncategorized' } );

			return {
				areaIcon: selectedArea?.icon || defaultArea?.icon,
				areaLabel: selectedArea?.label || __( 'Template Part' ),
			};
		},
		[ area ]
	);

	return (
		<Placeholder
			icon={ areaIcon }
			label={ areaLabel }
			instructions={ sprintf(
				// Translators: %s as template part area title ("Header", "Footer", etc.).
				__( 'Choose an existing %s or create a new one.' ),
				areaLabel.toLowerCase()
			) }
		>
			<Button variant="primary" onClick={ onOpenSelectionModal }>
				{ __( 'Choose' ) }
			</Button>
		</Placeholder>
	);
}
