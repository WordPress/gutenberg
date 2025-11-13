/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	Modal,
	Button,
	Flex,
	privateApis as componentsPrivateApis,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
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
	const { canUserUseUnfilteredHTML, editorStyles } = useSelect(
		( select ) => {
			const settings = select( blockEditorStore ).getSettings();
			return {
				canUserUseUnfilteredHTML:
					settings.__experimentalCanUserUseUnfilteredHTML,
				editorStyles: settings.styles,
			};
		},
		[]
	);

	// Show JS tab if user has permission OR if block contains JavaScript
	const shouldShowJsTab = canUserUseUnfilteredHTML || js.trim() !== '';

	// Combine all editor styles to inject into modal
	const styleContent = useMemo( () => {
		if ( ! editorStyles ) {
			return '';
		}
		return editorStyles
			.filter( ( style ) => style.css )
			.map( ( style ) => style.css )
			.join( '\n' );
	}, [ editorStyles ] );

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
				{ styleContent && (
					<style
						dangerouslySetInnerHTML={ { __html: styleContent } }
					/>
				) }
				<Tabs orientation="horizontal" defaultTabId="html">
					<VStack spacing={ 4 } style={ { height: '100%' } }>
						<HStack justify="space-between">
							<div>
								<Tabs.TabList>
									<Tabs.Tab tabId="html">HTML</Tabs.Tab>
									<Tabs.Tab tabId="css">CSS</Tabs.Tab>
									{ shouldShowJsTab && (
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
						<HStack
							alignment="stretch"
							justify="flex-start"
							spacing={ 4 }
							className="block-library-html__modal-tabs"
							style={ { flexGrow: 1 } }
						>
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
								{ shouldShowJsTab && (
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
							<div
								className="block-library-html__preview"
								style={ { width: '50%' } }
							>
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
					</VStack>
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
