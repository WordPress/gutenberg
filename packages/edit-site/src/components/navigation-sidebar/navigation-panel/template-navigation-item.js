/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalNavigationItem as NavigationItem,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TemplatePreview from './template-preview';
import { NavigationPanelPreviewFill } from '../index';
import { getTemplateInfo } from '../../../utils';

export default function TemplateNavigationItem( {
	onActivateItem,
	templateId,
} ) {
	const template = useSelect( ( select ) =>
		select( 'core' ).getEntityRecord(
			'postType',
			'wp_template',
			templateId
		)
	);
	const [ isPreviewVisible, setIsPreviewVisible ] = useState( false );
	const { title, description } = getTemplateInfo( template );

	return (
		<>
			<NavigationItem
				className="edit-site-navigation-panel__template-item"
				item={ `${ template.type }-${ templateId }` }
				title={ title }
			>
				<Button
					onClick={ () => onActivateItem( templateId ) }
					onMouseEnter={ () => setIsPreviewVisible( true ) }
					onMouseLeave={ () => setIsPreviewVisible( false ) }
				>
					{ title }
					{ description && (
						<div className="edit-site-navigation-panel__template-item-description">
							{ description }
						</div>
					) }
				</Button>
			</NavigationItem>

			{ isPreviewVisible && (
				<NavigationPanelPreviewFill>
					<TemplatePreview rawContent={ template.content.raw } />
				</NavigationPanelPreviewFill>
			) }
		</>
	);
}
