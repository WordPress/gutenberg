/**
 * WordPress dependencies
 */
import { __experimentalInserterListItemWithModal as InserterListItemWithModal } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useTemplatePartArea } from '../utils/hooks';
import TemplatePartSelection from '../components/template-part-selection';
import createTemplatePartPostData from '../utils/create-template-part-post-data';

export default function TemplatePartInserterItem( props ) {
	const { rootClientId, item, onSelect } = props;
	const { saveEntityRecord } = useDispatch( coreStore );

	const area = item?.initialAttributes?.area;
	const areaType = useTemplatePartArea( area );
	const templatePartAreaLabel =
		areaType?.label.toLowerCase() ?? __( 'template part' );

	return (
		<InserterListItemWithModal
			{ ...props }
			modalProps={ {
				overlayClassName: 'block-editor-template-part__selection-modal',
				title: sprintf(
					// Translators: %s as template part area title ("Header", "Footer", etc.).
					__( 'Choose a %s' ),
					templatePartAreaLabel
				),
				closeLabel: __( 'Cancel' ),
			} }
		>
			<TemplatePartSelection
				area={ area }
				rootClientId={ rootClientId }
				onTemplatePartSelect={ async ( pattern ) => {
					const templatePart = pattern.templatePart;
					const inserterItem = {
						name: 'core/template-part',
						initialAttributes: {
							slug: templatePart.slug,
							theme: templatePart.theme,
						},
					};
					const focusBlock = true;
					onSelect( inserterItem, focusBlock );
				} }
				onPatternSelect={ async ( pattern, blocks ) => {
					const templatePartPostData =
						await createTemplatePartPostData(
							area,
							blocks,
							pattern.title
						);

					const templatePart = await saveEntityRecord(
						'postType',
						'wp_template_part',
						templatePartPostData
					);

					const inserterItem = {
						name: 'core/template-part',
						initialAttributes: {
							slug: templatePart.slug,
							theme: templatePart.theme,
						},
					};
					const focusBlock = true;
					onSelect( inserterItem, focusBlock );
				} }
			/>
		</InserterListItemWithModal>
	);
}
