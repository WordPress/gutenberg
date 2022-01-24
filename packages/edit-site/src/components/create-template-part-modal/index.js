/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	Icon,
	BaseControl,
	TextControl,
	Flex,
	FlexItem,
	FlexBlock,
	Button,
	Modal,
	__experimentalRadioGroup as RadioGroup,
	__experimentalRadio as Radio,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { store as editorStore } from '@wordpress/editor';
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { TEMPLATE_PART_AREA_GENERAL } from '../../store/constants';

export default function CreateTemplatePartModal( { closeModal, onCreate } ) {
	const [ title, setTitle ] = useState( '' );
	const [ area, setArea ] = useState( TEMPLATE_PART_AREA_GENERAL );
	const [ isSubmitting, setIsSubmitting ] = useState( false );
	const instanceId = useInstanceId( CreateTemplatePartModal );

	const templatePartAreas = useSelect(
		( select ) =>
			select( editorStore ).__experimentalGetDefaultTemplatePartAreas(),
		[]
	);

	return (
		<Modal
			title={ __( 'Create a template part' ) }
			closeLabel={ __( 'Close' ) }
			onRequestClose={ closeModal }
			overlayClassName="edit-site-create-template-part-modal"
		>
			<form
				onSubmit={ async ( event ) => {
					event.preventDefault();
					if ( ! title ) {
						return;
					}
					setIsSubmitting( true );
					await onCreate( { title, area } );
				} }
			>
				<TextControl
					label={ __( 'Name' ) }
					value={ title }
					onChange={ setTitle }
					required
				/>
				<BaseControl
					label={ __( 'Area' ) }
					id={ `edit-site-create-template-part-modal__area-selection-${ instanceId }` }
					className="edit-site-create-template-part-modal__area-base-control"
				>
					<RadioGroup
						label={ __( 'Area' ) }
						className="edit-site-create-template-part-modal__area-radio-group"
						id={ `edit-site-create-template-part-modal__area-selection-${ instanceId }` }
						onChange={ setArea }
						checked={ area }
					>
						{ templatePartAreas.map(
							( { icon, label, area: value, description } ) => (
								<Radio
									key={ label }
									value={ value }
									className="edit-site-create-template-part-modal__area-radio"
								>
									<Flex align="start" justify="start">
										<FlexItem>
											<Icon icon={ icon } />
										</FlexItem>
										<FlexBlock className="edit-site-create-template-part-modal__option-label">
											{ label }
											<div>{ description }</div>
										</FlexBlock>

										<FlexItem className="edit-site-create-template-part-modal__checkbox">
											{ area === value && (
												<Icon icon={ check } />
											) }
										</FlexItem>
									</Flex>
								</Radio>
							)
						) }
					</RadioGroup>
				</BaseControl>
				<Flex
					className="edit-site-create-template-part-modal__modal-actions"
					justify="flex-end"
				>
					<FlexItem>
						<Button
							variant="secondary"
							onClick={ () => {
								closeModal();
							} }
						>
							{ __( 'Cancel' ) }
						</Button>
					</FlexItem>
					<FlexItem>
						<Button
							variant="primary"
							type="submit"
							disabled={ ! title }
							isBusy={ isSubmitting }
						>
							{ __( 'Create' ) }
						</Button>
					</FlexItem>
				</Flex>
			</form>
		</Modal>
	);
}
