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

/**
 * Internal dependencies
 */
import TemplatePreview from './template-preview';
import { NavigationPanelPreviewFill } from '../index';
import { getTemplateInfo } from '../../../utils';

export default function TemplateNavigationItem( { item } ) {
	const defaultTemplateTypesDefinitions = useSelect( ( select ) => {
		const { getSettings } = select( 'core/edit-site' );
		return getSettings()?.defaultTemplateTypesDefinitions;
	}, [] );
	const { setTemplate, setTemplatePart } = useDispatch( 'core/edit-site' );
	const [ isPreviewVisible, setIsPreviewVisible ] = useState( false );

	const { title, description } = getTemplateInfo(
		item,
		defaultTemplateTypesDefinitions
	);

	const onActivateItem = () =>
		'wp_template' === item.type
			? setTemplate( item.id )
			: setTemplatePart( item.id );

	return (
		<NavigationItem
			className="edit-site-navigation-panel__template-item"
			item={ `${ item.type }-${ item.id }` }
			title={ title }
		>
			<Button
				onClick={ onActivateItem }
				onMouseEnter={ () => setIsPreviewVisible( true ) }
				onMouseLeave={ () => setIsPreviewVisible( false ) }
			>
				<div className="edit-site-navigation-panel__template-item-title">
					{ 'draft' === item.status && <em>{ __( '[Draft]' ) }</em> }
					{ title }
				</div>
				{ description && (
					<div className="edit-site-navigation-panel__template-item-description">
						{ description }
					</div>
				) }
			</Button>

			{ isPreviewVisible && (
				<NavigationPanelPreviewFill>
					<TemplatePreview rawContent={ item.content.raw } />
				</NavigationPanelPreviewFill>
			) }
		</NavigationItem>
	);
}
