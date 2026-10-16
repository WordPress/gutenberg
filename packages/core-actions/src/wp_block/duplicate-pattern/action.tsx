import { _x } from '@wordpress/i18n';
// @ts-expect-error `@wordpress/patterns` is not typed yet.
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import { unlock } from '../../lock-unlock';
import type { Pattern, ActionScriptParts } from '../../shared/types';

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
 * The JavaScript parts of the duplicate action for Pattern; its data is in
 * `action.php`.
 */
export default duplicatePattern;
