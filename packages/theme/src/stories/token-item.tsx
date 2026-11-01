import type { CSSProperties } from 'react';
import { CopyTokenButton } from './copy-token-button';
import { ShareTokenLink } from './share-token-link';
import { tokens } from '../../prebuilt/js/design-tokens.mjs';
import {
	descriptionStyle,
	textStyle,
	tokenNameStyle,
} from './token-preview-styles';

export const nameRowStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--wpds-dimension-gap-xs)',
};

type TokenName = keyof typeof tokens;

/**
 * Element id for a token, e.g. `--wpds-gap-md` becomes `wpds-gap-md`. Storybook
 * scrolls to the element whose id matches the URL hash.
 *
 * @param name Token CSS custom property name.
 */
export const tokenId = ( name: string ) => name.replace( /^--/, '' );

/**
 * Token name and description, with a copy button and a link to the token's
 * own URL hash.
 *
 * @param props
 * @param props.name Token CSS custom property name.
 */
export function TokenText( { name }: { name: TokenName } ) {
	const id = tokenId( name );

	return (
		<dt id={ id } data-token-row="" style={ textStyle }>
			<span style={ nameRowStyle }>
				<code id={ `${ id }-name` } style={ tokenNameStyle }>
					{ name }
				</code>
				<CopyTokenButton name={ name } describedBy={ `${ id }-name` } />
				<ShareTokenLink id={ id } name={ name } />
			</span>
			<span style={ descriptionStyle }>
				{ tokens[ name ].$description }
			</span>
		</dt>
	);
}
