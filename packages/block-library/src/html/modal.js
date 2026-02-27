/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	Modal,
	Button,
	Flex,
	Notice,
	privateApis as componentsPrivateApis,
	__experimentalHStack as HStack,
	__experimentalGrid as Grid,
} from '@wordpress/components';
import { PlainText, store as blockEditorStore } from '@wordpress/block-editor';
import { fullscreen, square } from '@wordpress/icons';

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
	const [ isFullscreen, setIsFullscreen ] = useState( false );

	// Check if user has permission to save scripts and get editor styles
	const { canUserUseUnfilteredHTML } = useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();
		return {
			canUserUseUnfilteredHTML:
				settings.__experimentalCanUserUseUnfilteredHTML,
		};
	}, [] );

	// Determine if we should show a warning about CSS/JS content being stripped
	const hasRestrictedContent =
		! canUserUseUnfilteredHTML && ( css.trim() || js.trim() );

	if ( ! isOpen ) {
		return null;
	}

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
		// For users without unfiltered_html capability, strip CSS and JS content
		// to prevent kses from leaving broken content
		setAttributes( {
			content: serializeContent( {
				html: editedHtml,
				css: canUserUseUnfilteredHTML ? editedCss : '',
				js: canUserUseUnfilteredHTML ? editedJs : '',
			} ),
		} );
		setIsDirty( false );
	};
	const handleCancel = () => {
		setIsDirty( false );
		onRequestClose();
	};
	const handleRequestClose = () => {
		if ( isDirty ) {
			setShowUnsavedWarning( true );
		} else {
			onRequestClose();
		}
	};
	const handleDiscardChanges = () => {
		setShowUnsavedWarning( false );
		onRequestClose();
	};
	const handleContinueEditing = () => {
		setShowUnsavedWarning( false );
	};
	const handleUpdateAndClose = () => {
		handleUpdate();
		onRequestClose();
	};
	const toggleFullscreen = () => {
		setIsFullscreen( ( prevState ) => ! prevState );
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
				isFullScreen={ isFullscreen }
				__experimentalHideHeader
			>
				<Tabs orientation="horizontal" defaultTabId="html">
					<Grid
						columns={ 1 }
						templateRows="auto 1fr auto"
						gap={ 4 }
						style={ { height: '100%' } }
					>
						<HStack
							justify="space-between"
							className="block-library-html__modal-header"
						>
							<div>
								<Tabs.TabList>
									<Tabs.Tab tabId="html">HTML</Tabs.Tab>
									{ canUserUseUnfilteredHTML && (
										<Tabs.Tab tabId="css">CSS</Tabs.Tab>
									) }
									{ canUserUseUnfilteredHTML && (
										<Tabs.Tab tabId="js">
											{ __( 'JavaScript' ) }
										</Tabs.Tab>
									) }
								</Tabs.TabList>
							</div>
							<div>
								<Button
									__next40pxDefaultSize
									icon={ isFullscreen ? square : fullscreen }
									label={ __( 'Enable/disable fullscreen' ) }
									onClick={ toggleFullscreen }
									variant="tertiary"
								/>
							</div>
						</HStack>
						{ hasRestrictedContent && (
							<Notice
								status="warning"
								isDismissible={ false }
								className="block-library-html__modal-notice"
							>
								{ __(
									'This block contains CSS or JavaScript that will be removed when you save because you do not have permission to use unfiltered HTML.'
								) }
							</Notice>
						) }
						<HStack
							alignment="stretch"
							justify="flex-start"
							spacing={ 4 }
							className="block-library-html__modal-tabs"
						>
							<div className="block-library-html__modal-content">
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
								{ canUserUseUnfilteredHTML && (
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
								) }
								{ canUserUseUnfilteredHTML && (
									<Tabs.TabPanel
										tabId="js"
										focusable={ false }
										className="block-library-html__modal-tab"
									>
										<PlainText
											value={ editedJs }
											onChange={ handleJsChange }
											placeholder={ __(
												'Write JavaScript…'
											) }
											aria-label={ __( 'JavaScript' ) }
											className="block-library-html__modal-editor"
										/>
									</Tabs.TabPanel>
								) }
							</div>
							<div className="block-library-html__preview">
								<Preview
									content={ serializeContent( {
										html: editedHtml,
										css: editedCss,
										js: editedJs,
									} ) }
								/>
							</div>
						</HStack>
						<HStack
							alignment="center"
							justify="flex-end"
							spacing={ 4 }
							className="block-library-html__modal-footer"
						>
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
								onClick={ handleUpdateAndClose }
							>
								{ __( 'Update' ) }
							</Button>
						</HStack>
					</Grid>
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
							{ __( 'Update and close' ) }
						</Button>
					</Flex>
				</Modal>
			) }
		</>
	);
}
