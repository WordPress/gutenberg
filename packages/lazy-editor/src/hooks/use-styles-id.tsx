/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

// Define interface for template with optional styles_id
interface Template {
	styles_id?: string;
	[ key: string ]: any;
}

/**
 * This is a React hook that provides the styles ID.
 * Styles ID can be associated with a template.
 * If a template has a styles ID, it will be used otherwise the global styles ID will be used.
 *
 * @param {Object} props              - The props object.
 * @param {string} [props.templateId] - The ID of the template to use.
 * @return The styles ID.
 */
export function useStylesId( { templateId }: { templateId?: string } ) {
	const { globalStylesId, stylesId } = useSelect(
		( select ) => {
			const coreDataSelect = select( coreStore );
			const template = templateId
				? ( coreDataSelect.getEntityRecord(
						'postType',
						'wp_template',
						templateId
				  ) as Template | null )
				: null;

			return {
				globalStylesId:
					coreDataSelect.__experimentalGetCurrentGlobalStylesId(),
				stylesId: template?.styles_id,
			};
		},
		[ templateId ]
	);

	// Otherwise, fall back to the global styles ID
	return stylesId || globalStylesId;
}
