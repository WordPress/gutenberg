/**
 * External dependencies
 */
import downloadjs from 'downloadjs';

/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import apiFetch from '@wordpress/api-fetch';
import { download } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ToolsMoreMenuGroup from '../components/header/tools-more-menu-group';

registerPlugin( 'edit-site', {
	render() {
		return (
			<>
				<ToolsMoreMenuGroup>
					<MenuItem
						role="menuitem"
						icon={ download }
						onClick={ () =>
							apiFetch( {
								path: '/__experimental/edit-site/v1/export',
								parse: false,
							} )
								.then( ( res ) => res.blob() )
								.then( ( blob ) =>
									downloadjs(
										blob,
										'edit-site-export.zip',
										'application/zip'
									)
								)
						}
						info={ __(
							'Download your templates and template parts.'
						) }
					>
						{ __( 'Export' ) }
					</MenuItem>
				</ToolsMoreMenuGroup>
			</>
		);
	},
} );
