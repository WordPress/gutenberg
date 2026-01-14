/**
 * Content Guidelines Package
 *
 * Site-level editorial guidelines for WordPress. While Global Styles define how
 * your site looks, Content Guidelines define how your site sounds.
 *
 * @package
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
export { default as ImportExport } from './components/import-export';
export { default as HistoryPanel } from './components/history';

/**
 * Export store name for data integration.
 */
export { STORE_NAME, ENTITY_KIND, ENTITY_NAME, ENTITY_ID } from './store';

/**
 * Export store for direct registration if needed.
 */
export { store } from './store';

/**
 * Export the useGuidelines hook for canonical core-data access.
 * This is the recommended way to interact with content guidelines.
 */
export { useGuidelines } from './hooks';
