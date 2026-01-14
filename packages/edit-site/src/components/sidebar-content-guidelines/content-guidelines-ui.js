/**
 * WordPress dependencies
 */
import { GuidelinesPage } from '@wordpress/content-guidelines';

/**
 * Content Guidelines UI wrapper component.
 *
 * This component wraps the full guidelines editing interface from
 * @wordpress/content-guidelines package.
 *
 * @param {Object}   props              Component props.
 * @param {string}   props.path         Current section path.
 * @param {Function} props.onPathChange Callback when path changes.
 * @return {Element} The content guidelines UI.
 */
export default function ContentGuidelinesUI( { path, onPathChange } ) {
	return <GuidelinesPage path={ path } onPathChange={ onPathChange } />;
}
