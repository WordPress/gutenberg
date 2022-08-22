/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __experimentalInserterListItemWithModal as InserterListItemWithModal } from '@wordpress/block-editor';
import {
	Button,
	__experimentalHStack as HStack,
	Spinner,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createTemplatePartPostData, useTemplatePartArea } from './utils';
import TemplatePartSelection from './template-part-selection';

export default function TemplatePartInserterItem( props ) {
	const [ isSaving, setIsSaving ] = useState( false );
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
				overlayClassName: 'block-library-template-part-selection-modal',
				contentClassName:
					'block-library-template-part-selection-modal__content',
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
					setIsSaving( true );
					const templatePartPostData = createTemplatePartPostData(
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
			<HStack
				alignment="right"
				className="block-library-template-part-selection-modal__footer"
			>
				<Button
					variant="tertiary"
					onClick={ async () => {
						setIsSaving( true );
						const templatePartPostData =
							createTemplatePartPostData( area );

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
				>
					{ __( 'Start blank' ) }
				</Button>
			</HStack>
			<div
				className={ classnames(
					'block-library-template-part-selection__saving-overlay',
					{ 'is-saving': isSaving }
				) }
			>
				<Spinner className="block-library-template-part-selection__spinner" />
			</div>
		</InserterListItemWithModal>
	);
}
