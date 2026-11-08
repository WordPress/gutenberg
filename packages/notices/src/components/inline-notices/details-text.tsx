import { Link } from '@wordpress/ui';

const URL_PATTERN = /https?:\/\/[^\s<>"]+/g;

/**
 * Removes punctuation that ends the sentence around a URL rather than the URL
 * itself, including a closing parenthesis that has no opening one in the URL,
 * as in `text (URL)`.
 *
 * @param url The matched URL.
 *
 * @return The URL without trailing punctuation.
 */
function trimTrailingPunctuation( url: string ) {
	let end = url.length;
	while ( end > 0 ) {
		const character = url[ end - 1 ];
		if ( '.,;:!?\'"'.includes( character ) ) {
			end--;
			continue;
		}
		if ( character === ')' ) {
			const candidate = url.slice( 0, end );
			const opening = candidate.split( '(' ).length - 1;
			const closing = candidate.split( ')' ).length - 1;
			if ( closing > opening ) {
				end--;
				continue;
			}
		}
		break;
	}
	return url.slice( 0, end );
}

/**
 * Renders plain-text details with their web addresses as links. The details
 * stay plain text, so this is the only place that knows about links.
 *
 * @param props          Component props.
 * @param props.children The details.
 */
export default function DetailsText( { children }: { children: string } ) {
	const parts = [];
	let lastIndex = 0;
	for ( const match of children.matchAll( URL_PATTERN ) ) {
		const url = trimTrailingPunctuation( match[ 0 ] );
		parts.push( children.slice( lastIndex, match.index ) );
		parts.push(
			// The failure that a notice reports may have left unsaved changes,
			// so a link must not navigate away from them.
			<Link key={ match.index } href={ url } tone="neutral" openInNewTab>
				{ url }
			</Link>
		);
		lastIndex = match.index + url.length;
	}
	parts.push( children.slice( lastIndex ) );

	return <>{ parts }</>;
}
