/**
 * WordPress dependencies
 */
import { serialize } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const PLACEHOLDER_STEPS = {
	templatePart: 1,
	navigation: 2,
};

/**
 * Internal dependencies
 */
import TemplatePartStep from './template-part-step';
import NavigationStep from './navigation-step';

export default function Placeholder( {
	area,
	enableSelection,
	hasResolvedReplacements,
	onFinish,
} ) {
	const [ step, setStep ] = useState( PLACEHOLDER_STEPS.templatePart );
	const [ templatePartTitle, setTemplatePartTitle ] = useState( '' );
	const { saveEntityRecord } = useDispatch( coreStore );

	const createTemplatePart = useCallback(
		async ( title = __( 'Untitled Menu' ), blocks = [] ) => {
			// If we have `area` set from block attributes, means an exposed
			// block variation was inserted. So add this prop to the template
			// part entity on creation. Afterwards remove `area` value from
			// block attributes.
			const record = {
				title,
				slug: 'template-part',
				content: serialize( blocks ),
				// `area` is filterable on the server and defaults to `UNCATEGORIZED`
				// if provided value is not allowed.
				area,
			};

			const templatePart = await saveEntityRecord(
				'postType',
				'wp_template_part',
				record
			);

			return {
				slug: templatePart.slug,
				theme: templatePart.theme,
				area: undefined,
			};
		},
		[ area ]
	);

	return (
		<>
			{ step === PLACEHOLDER_STEPS.templatePart && (
				<TemplatePartStep
					area={ area }
					enableSelection={ enableSelection }
					hasResolvedReplacements={ hasResolvedReplacements }
					onCreateNew={ ( newTitle ) => {
						setTemplatePartTitle( newTitle );
						setStep( PLACEHOLDER_STEPS.navigation );
					} }
					onSelectExisting={ ( templatePartAttributes ) => {
						onFinish( templatePartAttributes );
					} }
				/>
			) }
			{ step === PLACEHOLDER_STEPS.navigation && (
				<NavigationStep
					onFinish={ async ( blocks ) => {
						const templatePartAttributes = await createTemplatePart(
							templatePartTitle,
							blocks
						);
						onFinish( templatePartAttributes );
					} }
				/>
			) }
		</>
	);
}
