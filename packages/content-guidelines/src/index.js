/**
 * Content Guidelines Package
 *
 * Site-level editorial guidelines for WordPress. While Global Styles define how
 * your site looks, Content Guidelines define how your site sounds.
 *
 * @package @wordpress/content-guidelines
 */

/**
 * Internal dependencies
 */
import './store';
import './style.scss';

/**
 * Export the main GuidelinesPage component.
 *
 * This is the primary UI component for the Content Guidelines panel.
 * It can be used standalone or embedded in the Site Editor.
 */
export { default as GuidelinesPage } from './components/guidelines-page';

/**
 * Export individual panel components for granular use.
 */
export { default as LibraryPanel } from './components/library-panel';
export { default as BlocksPanel } from './components/blocks-panel';
export { default as Playground } from './components/playground';

/**
 * Export store name for data integration.
 */
export { STORE_NAME } from './store';

/**
 * Export store for direct registration if needed.
 */
export { store } from './store';
