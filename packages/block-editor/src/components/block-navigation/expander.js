/**
 * WordPress dependencies
 */
import { chevronRight, Icon } from '@wordpress/icons';
export default function BlockNavigationExpander( { onClick } ) {
	return (
		//TODO: add keyboard events as noted in https://www.w3.org/TR/wai-aria-practices/examples/treegrid/treegrid-1.html
		// eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
		<span
			className="block-editor-block-navigation__expander"
			onClick={ ( event ) => onClick( event, { forceToggle: true } ) }
		>
			<Icon icon={ chevronRight } />
		</span>
	);
}
