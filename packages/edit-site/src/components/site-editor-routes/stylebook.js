/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationScreenUnsupported from '../sidebar-navigation-screen-unsupported';
import { unlock } from '../../lock-unlock';
import { isClassicThemeWithStyleBookSupport } from './utils';

const { StyleBookPreview } = unlock( editorPrivateApis );

export const stylebookRoute = {
	name: 'stylebook',
	path: '/stylebook',
	areas: {
		sidebar( { siteData } ) {
			return isClassicThemeWithStyleBookSupport( siteData ) ? (
				<SidebarNavigationScreen
					title={ __( 'Styles' ) }
					backPath="/"
					description={ __(
						`Preview your website's visual identity: colors, typography, and blocks.`
					) }
				/>
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
		preview( { siteData } ) {
			return isClassicThemeWithStyleBookSupport( siteData ) ? (
				<StyleBookPreview isStatic />
			) : undefined;
		},
		mobile( { siteData } ) {
			return isClassicThemeWithStyleBookSupport( siteData ) ? (
				<StyleBookPreview isStatic />
			) : undefined;
		},
	},
};
