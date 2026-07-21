/**
 * WordPress dependencies
 */
import { useDisabled } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import HtmlRenderer from '../../utils/html-renderer';

export default function ReadOnlyNavigationInnerBlocks( { content = '' } ) {
	const disabledRef = useDisabled();

	return (
		<div ref={ disabledRef } className="wp-block-navigation__container">
			<HtmlRenderer html={ content } />
		</div>
	);
}
