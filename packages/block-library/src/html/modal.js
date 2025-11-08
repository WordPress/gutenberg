/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	Modal,
	Button,
	Flex,
	privateApis as componentsPrivateApis,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { PlainText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import Preview from './preview';
import { parseContent, serializeContent } from './utils';

const { Tabs } = unlock( componentsPrivateApis );

export default function HTMLEditModal( {
	isOpen,
	onRequestClose,
	content,
	setAttributes,
} ) {
	// Parse content into separate sections and use as initial state
	const { html, css, js } = parseContent( content );
	const [ editedHtml, setEditedHtml ] = useState( html );
	const [ editedCss, setEditedCss ] = useState( css );
	const [ editedJs, setEditedJs ] = useState( js );
	const [ isDirty, setIsDirty ] = useState( false );
	const [ showUnsavedWarning, setShowUnsavedWarning ] = useState( false );

	if ( ! isOpen ) {
		return null;
	}

	// Wrapper functions that mark content as dirty
	const handleHtmlChange = ( value ) => {
		setEditedHtml( value );
		setIsDirty( true );
	};

	const handleCssChange = ( value ) => {
		setEditedCss( value );
		setIsDirty( true );
	};

	const handleJsChange = ( value ) => {
		setEditedJs( value );
		setIsDirty( true );
	};

	const handleUpdate = () => {
		setAttributes( {
			content: serializeContent( {
				html: editedHtml,
				css: editedCss,
				js: editedJs,
			} ),
		} );
		setIsDirty( false );
	};

	const handleCancel = () => {
		setIsDirty( false );
		onRequestClose();
	};

	// Handle close request - check for unsaved changes
	const handleRequestClose = () => {
		if ( isDirty ) {
			setShowUnsavedWarning( true );
		} else {
			onRequestClose();
		}
	};

	// Handle discard confirmation
	const handleDiscardChanges = () => {
		setShowUnsavedWarning( false );
		onRequestClose();
	};

	// Handle continue editing
	const handleContinueEditing = () => {
		setShowUnsavedWarning( false );
	};

	// Handle update and close
	const handleUpdateAndClose = () => {
		handleUpdate();
		onRequestClose();
	};

	return (
		<>
			<Modal
				title={ __( 'Edit HTML' ) }
				onRequestClose={ handleRequestClose }
				className="block-library-html__modal"
				size="large"
				isDismissible={ false }
				shouldCloseOnClickOutside={ ! isDirty }
				shouldCloseOnEsc={ ! isDirty }
				isFullScreen
				headerActions={
					<>
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ handleCancel }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							onClick={ handleUpdate }
						>
							{ __( 'Save' ) }
						</Button>
					</>
				}
			>
				<Tabs orientation="vertical" defaultTabId="html">
					<HStack
						alignment="stretch"
						justify="flex-start"
						spacing={ 4 }
						className="block-library-html__modal-tabs"
					>
						<div>
							<Tabs.TabList>
								<Tabs.Tab tabId="html">HTML</Tabs.Tab>
								<Tabs.Tab tabId="css">CSS</Tabs.Tab>
								<Tabs.Tab tabId="js">
									{ __( 'JavaScript' ) }
								</Tabs.Tab>
								<Tabs.Tab tabId="preview">
									{ __( 'Preview' ) }
								</Tabs.Tab>
							</Tabs.TabList>
						</div>
						<div style={ { flexGrow: 1 } }>
							<Tabs.TabPanel
								tabId="html"
								focusable={ false }
								className="block-library-html__modal-tab"
							>
								<PlainText
									value={ editedHtml }
									onChange={ handleHtmlChange }
									placeholder={ __( 'Write HTML…' ) }
									aria-label={ __( 'HTML' ) }
									className="block-library-html__modal-editor"
								/>
							</Tabs.TabPanel>
							<Tabs.TabPanel
								tabId="css"
								focusable={ false }
								className="block-library-html__modal-tab"
							>
								<PlainText
									value={ editedCss }
									onChange={ handleCssChange }
									placeholder={ __( 'Write CSS…' ) }
									aria-label={ __( 'CSS' ) }
									className="block-library-html__modal-editor"
								/>
							</Tabs.TabPanel>
							<Tabs.TabPanel
								tabId="js"
								focusable={ false }
								className="block-library-html__modal-tab"
							>
								<PlainText
									value={ editedJs }
									onChange={ handleJsChange }
									placeholder={ __( 'Write JavaScript…' ) }
									aria-label={ __( 'JavaScript' ) }
									className="block-library-html__modal-editor"
								/>
							</Tabs.TabPanel>
							<Tabs.TabPanel
								tabId="preview"
								focusable={ false }
								className="block-library-html__modal-tab"
							>
								<Preview
									content={ serializeContent( {
										html: editedHtml,
										css: editedCss,
										js: editedJs,
									} ) }
									isSelected
								/>
							</Tabs.TabPanel>
						</div>
					</HStack>
				</Tabs>
			</Modal>

			{ showUnsavedWarning && (
				<Modal
					title={ __( 'Unsaved changes' ) }
					onRequestClose={ handleContinueEditing }
					size="medium"
				>
					<p>
						{ __(
							'You have unsaved changes. What would you like to do?'
						) }
					</p>
					<Flex direction="row" justify="flex-end" gap={ 2 }>
						<Button
							__next40pxDefaultSize
							variant="secondary"
							onClick={ handleDiscardChanges }
						>
							{ __( 'Discard unsaved changes' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							variant="secondary"
							onClick={ handleContinueEditing }
						>
							{ __( 'Continue editing' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							onClick={ handleUpdateAndClose }
						>
							{ __( 'Save and close' ) }
						</Button>
					</Flex>
				</Modal>
			) }
		</>
	);
}
