/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Button,
	Modal,
	PanelBody,
	NavigableMenu,
	RadioControl,
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__unstableCompositeItem as CompositeItem,
} from '@wordpress/components';
import { addQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';
import { parse } from '@wordpress/blocks';
import { BlockPreview, BlockEditorProvider } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import useBlockEditorSettings from '../block-editor/use-block-editor-settings';

const TEMPLATE_PANELS = [
	{
		title: __( 'Page Templates' ),
		// missing custom
		templates: [ 'page', 'front-page', '404', 'search' ],
	},
	{
		title: __( 'Blog' ),
		templates: [ 'single-post', 'archive', 'category', 'tag', 'author' ],
	},
];

function PossibleTemplatesPreview( { template } ) {
	const startBlankBlocks = useMemo(
		() =>
			parse(
				'<!-- wp:group {"style":{"spacing":{"padding":{"right":"1vh","bottom":"40vh","left":"1vh","top":"40vh"}},"color":{"background":"#f0f0f0"}},"layout":{"type":"constrained"}} -->\n' +
					'<div class="wp-block-group has-background" style="background-color:#f0f0f0;padding-top:40vh;padding-right:1vh;padding-bottom:40vh;padding-left:1vh"><!-- wp:paragraph {"align":"center"} -->\n' +
					'<p class="has-text-align-center">Start blank</p>\n' +
					'<!-- /wp:paragraph --></div>\n' +
					'<!-- /wp:group -->'
			),
		[]
	);
	const [ fallbackTemplateContent, setFallbackTemplateContent ] = useState();
	useEffect( () => {
		setFallbackTemplateContent( undefined );
		apiFetch( {
			path: addQueryArgs( '/wp/v2/templates/lookup', {
				slug: template.slug,
				is_custom: false,
				template_prefix: template.templatePrefix,
			} ),
		} ).then( ( fallbackTemplate ) => {
			setFallbackTemplateContent( parse( fallbackTemplate.content.raw ) );
		} );
	}, [ template.slug, template.templatePrefix ] );
	const settings = useBlockEditorSettings();
	const composite = useCompositeState( { orientation: 'horizontal' } );
	console.log( { startBlankBlocks } );
	if ( fallbackTemplateContent ) {
		return (
			<BlockEditorProvider settings={ settings }>
				<div>
					<Composite
						{ ...composite }
						role="listbox"
						className="edit-site-add-new-template-modal__item-list"
						aria-label={ __(
							'Choose a start content for the template'
						) }
					>
						<CompositeItem
							role="option"
							as="div"
							{ ...composite }
							className="edit-site-add-new-template-modal__preview-item"
							onClick={ () => {} }
							aria-label={ __(
								'Current template fallback content'
							) }
						>
							<BlockPreview
								blocks={ fallbackTemplateContent }
								viewportWidth={ 1440 }
								containerWidth={ 240 }
								__experimentalMinHeight={ 320 }
							/>
							<BlockPreview
								blocks={ startBlankBlocks }
								viewportWidth={ 1440 }
								containerWidth={ 240 }
								__experimentalMinHeight={ 320 }
							/>
						</CompositeItem>
					</Composite>
				</div>
			</BlockEditorProvider>
		);
	}
	return null;
}

function AddNewTemplateModal( { onClose, missingTemplates } ) {
	const panels = useMemo( () => {
		const _panels = [];
		TEMPLATE_PANELS.forEach( ( panel ) => {
			const templatesOfPanel = [];
			panel.templates.forEach( ( template ) => {
				const templateObject = missingTemplates.find(
					( { slug } ) => slug === template
				);
				if ( templateObject ) {
					templatesOfPanel.push( templateObject );
				}
			} );
			if ( templatesOfPanel.length > 0 ) {
				_panels.push( {
					title: panel.title,
					templates: templatesOfPanel,
				} );
			}
		} );
		const advancedTemplates = missingTemplates.filter( ( { slug } ) => {
			for ( const panel of TEMPLATE_PANELS ) {
				for ( const template of panel.templates ) {
					if ( slug === template ) {
						return false;
					}
				}
			}
			return true;
		} );
		if ( advancedTemplates.length ) {
			_panels.push( {
				templates: advancedTemplates,
				title: __( 'Advanced' ),
			} );
		}
		return _panels;
	}, [ missingTemplates ] );
	const [ selectedTemplate, setSelectedTemplate ] = useState();
	console.log( { panels } );
	return (
		<Modal
			title={ __( 'Add Template' ) }
			closeLabel={ __( 'Close' ) }
			onRequestClose={ onClose }
			overlayClassName="edit-site-add-new-template-modal"
		>
			<div className="edit-site-add-new-template-modal__container">
				<div className="edit-site-add-new-template-modal_side-menu">
					{ panels.map( ( { title, templates }, index ) => {
						return (
							<PanelBody
								key={ title }
								title={ title }
								initialOpen={ index === 0 }
							>
								<NavigableMenu
									className="edit-site-add-new-template-modal_side-button-container"
									orientation="vertical"
									onNavigate={ ( _childIndex, child ) => {
										child.click();
									} }
								>
									{ templates.map( ( template ) => {
										const isSelected =
											selectedTemplate?.slug ===
											template.slug;
										return (
											<Button
												key={ template.slug }
												className={ classnames(
													{
														'is-active': isSelected,
													},
													'edit-site-add-new-template-modal_side-button'
												) }
												aria-selected={ isSelected }
												onClick={ () => {
													setSelectedTemplate(
														template
													);
												} }
											>
												{ template.title }
											</Button>
										);
									} ) }
								</NavigableMenu>
							</PanelBody>
						);
					} ) }
				</div>
				<div className="edit-site-add-new-template-modal_content-area">
					{ selectedTemplate && (
						<PossibleTemplatesPreview
							template={ selectedTemplate }
						/>
					) }
					<RadioControl
						className="edit-site-add-new-template-modal__template-radio-control"
						label={ __( 'Create template for' ) }
						//selected={}
						options={ [
							{ label: 'All pages', value: 'a' },
							{ label: 'A specific page', value: 'e' },
						] }
						onChange={ ( value ) => console.log( value ) }
					/>
				</div>
			</div>
		</Modal>
	);
}

export default AddNewTemplateModal;
