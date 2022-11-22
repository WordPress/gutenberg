/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Button,
	Flex,
	FlexItem,
	Modal,
	TextControl,
	Panel,
	PanelBody,
	PanelRow,
	TabPanel,
} from '@wordpress/components';

function AddNewTemplateModal( { onClose } ) {
	return (
		<Modal
			title={ __( 'Add Template' ) }
			closeLabel={ __( 'Close' ) }
			onRequestClose={ onClose }
			overlayClassName="edit-site-add-new-template-modal"
		>
			<div className="edit-site-add-new-template-modal_side-menu">
				<PanelBody
					title={ __( 'Page templates' ) }
					initialOpen={ true }
				>
					<TabPanel
						className="edit-site-add-new-template__tab-panel"
						orientation="vertical"
						tabs={ [
							{
								name: 'tab1',
								title: 'Tab 1',
							},
							{
								name: 'tab2',
								title: 'Tab 2',
							},
						] }
					>
						{ ( tab ) => <p>{ tab.title }</p> }
					</TabPanel>
				</PanelBody>
				<PanelBody title={ __( 'Blog' ) } initialOpen={ true }>
					<PanelRow>My Panel Inputs and Labels</PanelRow>
				</PanelBody>
				<PanelBody title={ __( 'Advanced' ) } initialOpen={ true }>
					<PanelRow>My Panel Inputs and Labels</PanelRow>
				</PanelBody>
			</div>
		</Modal>
	);
}

export default AddNewTemplateModal;
