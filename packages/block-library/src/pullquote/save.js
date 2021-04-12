/**
 * External dependencies
 */
import classnames from 'classnames';
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	getColorClassName,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { SOLID_COLOR_CLASS } from './shared';

export default function save( { attributes } ) {
	const { value, citation } = attributes;
	const shouldShowCitation = ! RichText.isEmpty( citation );

	return (
		<figure { ...useBlockProps.save() }>
			<blockquote>
				<RichText.Content value={ value } multiline />
				{ shouldShowCitation && (
					<RichText.Content tagName="cite" value={ citation } />
				) }
			</blockquote>
		</figure>
	);
}
