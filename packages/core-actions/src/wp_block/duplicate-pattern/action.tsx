import { _x } from '@wordpress/i18n';
// @ts-expect-error `@wordpress/patterns` is not typed yet.
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import { unlock } from '../../lock-unlock';
import type { Pattern } from '../../shared/types';
import type { ActionScriptParts } from '../../types';

// Patterns.
const { CreatePatternModalContents, useDuplicatePatternProps } =
	unlock( patternsPrivateApis );

const duplicatePattern: ActionScriptParts< Pattern > = {
	isEligible: ( item ) => item.type !== 'wp_template_part',
	RenderModal: ( { items, closeModal } ) => {
		const [ item ] = items;
		const duplicatedProps = useDuplicatePatternProps( {
			pattern: item,
			onSuccess: () => closeModal?.(),
		} );
		return (
			<CreatePatternModalContents
				onClose={ closeModal }
				confirmLabel={ _x( 'Duplicate', 'action label' ) }
				{ ...duplicatedProps }
			/>
		);
	},
};

/**
 * Duplicate action for Pattern.
 */
export default duplicatePattern;
