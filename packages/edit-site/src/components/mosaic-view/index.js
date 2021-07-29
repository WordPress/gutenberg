/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { ENTER, SPACE } from '@wordpress/keycodes';
import {
	CheckboxControl,
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__unstableCompositeItem as CompositeItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TemplatePreview from './template-preview';
import TemplateActions from './template-actions';
import { store as editSiteStore } from '../../store';

function TemplateContainer( { templateId, composite } ) {
	const {
		setTemplate,
		setIsNavigationPanelOpened,
		toggleSelectedTemplate,
	} = useDispatch( editSiteStore );
	const {
		hasThemeFile,
		templateAuthor,
		templateDescription,
		templateSlug,
		templateSource,
		templateTitle,
		isSelected,
	} = useSelect(
		( select ) => {
			const { getEditedEntityRecord } = select( coreStore );
			const { isTemplateSelected } = select( editSiteStore );
			const template = templateId
				? getEditedEntityRecord( 'postType', 'wp_template', templateId )
				: {};
			return {
				hasThemeFile: template.has_theme_file,
				templateAuthor: template.author,
				templateDescription: template.description,
				templateSlug: template.slug,
				templateSource: template.source,
				templateTitle: template.title,
				isSelected: isTemplateSelected( templateId ),
			};
		},
		[ templateId ]
	);
	const onActivateItem = () => {
		setTemplate( templateId, templateSlug );
		setIsNavigationPanelOpened( false );
	};
	return (
		<CompositeItem
			{ ...composite }
			as="div"
			role="option"
			className="edit-site-mosaic-view__mosaic-item"
			tabIndex="0"
			onKeyDown={ ( event ) => {
				if ( ENTER === event.keyCode || SPACE === event.keyCode ) {
					event.preventDefault();
					onActivateItem();
				}
			} }
		>
			<TemplatePreview
				className="edit-site-mosaic-view__template-preview"
				templateId={ templateId }
				onClick={ onActivateItem }
			/>
			<CheckboxControl
				disabled={ templateSource !== 'custom' }
				label={ templateTitle }
				help={ templateDescription }
				checked={ isSelected }
				onChange={ () => toggleSelectedTemplate( templateId ) }
			/>
			{ templateSource === 'custom' && (
				<div>
					<TemplateActions
						hasThemeFile={ hasThemeFile }
						templateAuthor={ templateAuthor }
						templateId={ templateId }
						templateTitle={ templateTitle }
					/>
				</div>
			) }
		</CompositeItem>
	);
}

export default function MosaicView() {
	const composite = useCompositeState();
	const { templates } = useSelect( ( select ) => {
		const { getEntityRecords } = select( coreStore );
		return {
			templates: getEntityRecords( 'postType', 'wp_template', {
				per_page: -1,
			} ),
		};
	}, [] );
	if ( ! templates ) {
		return null;
	}
	return (
		<Composite
			{ ...composite }
			className="edit-site-mosaic-view"
			role="listbox"
			aria-label={ __( 'Templates list' ) }
		>
			{ templates.map( ( template ) => (
				<TemplateContainer
					key={ template.id }
					templateId={ template.id }
					composite={ composite }
				/>
			) ) }
		</Composite>
	);
}
