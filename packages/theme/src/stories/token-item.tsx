import { useContext } from '@wordpress/element';
import { DocsContext } from '@storybook/addon-docs/blocks';
import { NAVIGATE_URL } from 'storybook/internal/core-events';
import { tokens } from '../../prebuilt/js/design-tokens.mjs';
import styles from './token-item.module.css';
import { useScrollToHash } from './use-scroll-to-hash';
import {
	descriptionStyle,
	textStyle,
	tokenNameStyle,
} from './token-preview-styles';

type TokenName = keyof typeof tokens;

/**
 * Element id for a token, e.g. `--wpds-gap-md` becomes `wpds-gap-md`. Storybook
 * scrolls to the element whose id matches the URL hash.
 *
 * @param name Token CSS custom property name.
 */
const tokenId = ( name: string ) => name.replace( /^--/, '' );

/**
 * Props for the element that contains a token, making it a hover target for
 * the anchor link and the target of its hash link.
 *
 * @param name Token CSS custom property name.
 */
export function tokenCardProps( name: string ) {
	return { id: tokenId( name ), className: styles.card };
}

/**
 * Link that puts the token's URL hash in the address bar, matching the
 * "Copy heading URL to address bar" button on Storybook's headings.
 *
 * @param props
 * @param props.id Element id to link to.
 */
function TokenAnchor( { id }: { id: string } ) {
	const context = useContext( DocsContext );
	const hash = `#${ id }`;
	useScrollToHash( id );

	return (
		<span className={ styles.anchor }>
			<a
				href={ hash }
				target="_self"
				aria-label="Copy token URL to address bar"
				onClick={ ( event ) => {
					event.preventDefault();
					if ( document.getElementById( id ) ) {
						context?.channel.emit( NAVIGATE_URL, hash );
					}
				} }
			>
				<svg
					aria-hidden="true"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
					<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
				</svg>
			</a>
		</span>
	);
}

/**
 * Token name and description, with the anchor link. Render inside a container
 * spread with `tokenCardProps( name )`.
 *
 * @param props
 * @param props.name Token CSS custom property name.
 */
export function TokenText( { name }: { name: TokenName } ) {
	return (
		<dt style={ textStyle }>
			<TokenAnchor id={ tokenId( name ) } />
			<code style={ tokenNameStyle }>{ name }</code>
			<span style={ descriptionStyle }>
				{ tokens[ name ].$description }
			</span>
		</dt>
	);
}
