/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { PanelRow } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PostFooterToggle from './post-footer-toggle';
import PostHeaderToggle from './post-header-toggle';
import PostThemeStyleToggle from './post-theme-style-toggle';

const TemplateSettingsPanel = () => (
	<Fragment>
		<PanelRow>
			<PostThemeStyleToggle />
		</PanelRow>

		<PanelRow>
			<PostHeaderToggle />
		</PanelRow>

		<PanelRow>
			<PostFooterToggle />
		</PanelRow>
	</Fragment>
);

export default TemplateSettingsPanel;
