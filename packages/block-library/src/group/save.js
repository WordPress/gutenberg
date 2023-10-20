/**
 * WordPress dependencies
 */
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes: { tagName: Tag, showInView } } ) {
	const directives = {};
	// Add directives when `showInView` is true.
	if ( showInView ) {
		directives.className = 'show-in-view-animation';
		directives[ 'data-wp-interactive' ] = JSON.stringify( {
			namespace: 'core',
		} );
		directives[ 'data-wp-context' ] = JSON.stringify( {
			isVisible: false,
		} );
		directives[ 'data-wp-class--should-animate-in-view' ] =
			'context.shouldAnimateInView';
		directives[ 'data-wp-class--is-loaded' ] = 'context.isLoaded';
		directives[ 'data-wp-init' ] = 'callbacks.showInView';
	}

	return (
		<Tag
			{ ...useInnerBlocksProps.save( useBlockProps.save( directives ) ) }
		/>
	);
}
