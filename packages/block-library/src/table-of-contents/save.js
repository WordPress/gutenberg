/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TableOfContentsList from './list';
import { linearToNestedHeadingList } from './utils';

export default function save( { attributes: { headings = [], ariaLabel } } ) {
	if ( headings.length === 0 ) {
		return null;
	}
	return (
		<nav
			{ ...useBlockProps.save() }
			aria-label={ ariaLabel || __( 'Table of Contents' ) }
		>
			<ol>
				<TableOfContentsList
					nestedHeadingList={ linearToNestedHeadingList( headings ) }
				/>
			</ol>
		</nav>
	);
}
