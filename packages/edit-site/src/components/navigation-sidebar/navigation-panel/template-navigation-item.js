/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalNavigationItem as NavigationItem,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import TemplatePreview from './template-preview';
import { NavigationPanelPreviewFill } from '../index';
import { store as editSiteStore } from '../../../store';

export default function TemplateNavigationItem( { item } ) {
	const { title, description, editorMode } = useSelect( ( select ) => {
		return {
			...( 'wp_template' === item.type
				? select( editorStore ).__experimentalGetTemplateInfo( item )
				: {
						title: item?.title?.rendered || item?.slug,
						description: '',
				  } ),
			editorMode: select( editSiteStore ).getEditorMode(),
		};
	}, [] );
	const {
		setTemplate,
		setTemplatePart,
		switchEditorMode,
		setIsNavigationPanelOpened,
	} = useDispatch( editSiteStore );
	const [ isPreviewVisible, setIsPreviewVisible ] = useState( false );

	if ( ! item ) {
		return null;
	}

	const onActivateItem = () => {
		if ( 'wp_template' === item.type ) {
			setTemplate( item.id, item.slug );
		} else {
			setTemplatePart( item.id );
		}
		setIsNavigationPanelOpened( false );
		if ( editorMode !== 'visual' ) {
			switchEditorMode( 'visual' );
		}
	};

	return (
		<NavigationItem
			className="edit-site-navigation-panel__template-item"
			item={ `${ item.type }-${ item.id }` }
		>
			<Button
				onClick={ onActivateItem }
				onMouseEnter={ () => setIsPreviewVisible( true ) }
				onMouseLeave={ () => setIsPreviewVisible( false ) }
			>
				<span className="edit-site-navigation-panel__info-wrapper">
					<div className="edit-site-navigation-panel__template-item-title">
						{ 'draft' === item.status && (
							<em>{ __( '[Draft]' ) }</em>
						) }
						{ title }
					</div>
					{ description && (
						<div className="edit-site-navigation-panel__template-item-description">
							{ description }
						</div>
					) }
				</span>
			</Button>

			{ isPreviewVisible && (
				<NavigationPanelPreviewFill>
					<TemplatePreview
						className="edit-site-navigation-panel__preview"
						rawContent={ item.content.raw }
					/>
				</NavigationPanelPreviewFill>
			) }
		</NavigationItem>
	);
}
