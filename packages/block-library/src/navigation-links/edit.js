/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import NavigationPlaceholder from './placeholder';

export default function NavigationLinkEdit( { clientId } ) {
	const hasExistingNavItems = useSelect(
		( select ) =>
			select( 'core/block-editor' ).getBlocks( clientId ).length > 0,
		[ clientId ]
	);

	const { replaceInnerBlocks, selectBlock } = useDispatch(
		'core/block-editor'
	);

	if ( ! hasExistingNavItems ) {
		return (
			<Block.div>
				<NavigationPlaceholder
					onCreate={ ( blocks, selectNavigationBlock ) => {
						if ( blocks?.length ) {
							replaceInnerBlocks( clientId, blocks );
							if ( selectNavigationBlock ) {
								selectBlock( clientId );
							}
						}
					} }
				/>
			</Block.div>
		);
	}

	return (
		<InnerBlocks
			allowedBlocks={ [ 'core/navigation-link' ] }
			__experimentalTagName="ul"
			__experimentalAppenderTagName="li"
			__experimentalPassedProps={ {
				className: 'wp-block-navigation__container',
			} }
		/>
	);
}
