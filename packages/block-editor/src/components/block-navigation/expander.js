/**
 * WordPress dependencies
 */
import { chevronRight, Icon } from '@wordpress/icons';
export default function BlockNavigationExpander( { onClick } ) {
	return (
		// Keyboard events are handled by TreeGrid see: components/src/tree-grid/index.js
		// eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
		<span
			className="block-editor-block-navigation__expander"
			onClick={ ( event ) => onClick( event, { forceToggle: true } ) }
		>
			<Icon icon={ chevronRight } />
		</span>
	);
}
