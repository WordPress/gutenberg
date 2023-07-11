/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../../store/constants';
import { SIDEBAR_BLOCK, SIDEBAR_TEMPLATE } from '../constants';
import { store as editSiteStore } from '../../../store';

const entityLabels = {
	wp_navigation: __( 'Navigation' ),
	wp_block: __( 'Pattern' ),
	wp_template: __( 'Template' ),
};

const SettingsHeader = ( { sidebarName } ) => {
	const { hasPageContentFocus, entityType } = useSelect( ( select ) => {
		const { getEditedPostType, hasPageContentFocus: _hasPageContentFocus } =
			select( editSiteStore );

		return {
			hasPageContentFocus: _hasPageContentFocus(),
			entityType: getEditedPostType(),
		};
	} );

	const entityLabel = entityLabels[ entityType ] || entityLabels.wp_template;

	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const openTemplateSettings = () =>
		enableComplementaryArea( STORE_NAME, SIDEBAR_TEMPLATE );
	const openBlockSettings = () =>
		enableComplementaryArea( STORE_NAME, SIDEBAR_BLOCK );

	let templateAriaLabel;
	if ( hasPageContentFocus ) {
		templateAriaLabel =
			sidebarName === SIDEBAR_TEMPLATE
				? // translators: ARIA label for the Template sidebar tab, selected.
				  __( 'Page (selected)' )
				: // translators: ARIA label for the Template Settings Sidebar tab, not selected.
				  __( 'Page' );
	} else {
		templateAriaLabel =
			sidebarName === SIDEBAR_TEMPLATE
				? // translators: ARIA label for the Template sidebar tab, selected.
				  sprintf( __( '%s (selected)' ), entityLabel )
				: // translators: ARIA label for the Template Settings Sidebar tab, not selected.
				  entityLabel;
	}

	/* Use a list so screen readers will announce how many tabs there are. */
	return (
		<ul>
			<li>
				<Button
					onClick={ openTemplateSettings }
					className={ classnames(
						'edit-site-sidebar-edit-mode__panel-tab',
						{
							'is-active': sidebarName === SIDEBAR_TEMPLATE,
						}
					) }
					aria-label={ templateAriaLabel }
					data-label={
						hasPageContentFocus ? __( 'Page' ) : entityLabel
					}
				>
					{ hasPageContentFocus ? __( 'Page' ) : entityLabel }
				</Button>
			</li>
			<li>
				<Button
					onClick={ openBlockSettings }
					className={ classnames(
						'edit-site-sidebar-edit-mode__panel-tab',
						{
							'is-active': sidebarName === SIDEBAR_BLOCK,
						}
					) }
					aria-label={
						sidebarName === SIDEBAR_BLOCK
							? // translators: ARIA label for the Block Settings Sidebar tab, selected.
							  __( 'Block (selected)' )
							: // translators: ARIA label for the Block Settings Sidebar tab, not selected.
							  __( 'Block' )
					}
					data-label={ __( 'Block' ) }
				>
					{ __( 'Block' ) }
				</Button>
			</li>
		</ul>
	);
};

export default SettingsHeader;
