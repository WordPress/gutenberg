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

function TemplateContainer( { template, composite } ) {
	const {
		setTemplate,
		setIsNavigationPanelOpened,
		switchEditorMode,
	} = useDispatch( editSiteStore );

	const onActivateItem = () => {
		setTemplate( template.id, template.slug );
		setIsNavigationPanelOpened( false );
		switchEditorMode( 'visual' );
	};
	const actionsPossible = ! template.has_theme_file || template.wp_id;
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
				templateId={ template.id }
				onClick={ onActivateItem }
			/>
			<CheckboxControl
				disabled={ ! actionsPossible }
				label={ template.title.rendered }
				help={ template.description }
			/>
			{ actionsPossible && (
				<div>
					<TemplateActions template={ template } />
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
					template={ template }
					composite={ composite }
				/>
			) ) }
		</Composite>
	);
}
