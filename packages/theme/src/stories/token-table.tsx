import type { CSSProperties, ReactNode } from 'react';
import styles from './token-table.module.css';
import { tokens } from '../../prebuilt/js/design-tokens.mjs';
import { CopyTokenButton } from './copy-token-button';
import { ShareTokenLink } from './share-token-link';
import { nameRowStyle, tokenId } from './token-item';
import {
	descriptionStyle,
	textStyle,
	tokenNameStyle,
	valueStyle,
} from './token-preview-styles';

const tokenData = tokens as Record<
	string,
	{ $description: string; modes: { default: { css: string } } }
>;

/**
 * Table of tokens with a sample, the token name and description, and its
 * default value, shared by the token documentation pages.
 *
 * @param props
 * @param props.names        Token names, in display order.
 * @param props.renderSample Renders the visual sample for a token.
 * @param props.sampleWidth  Width of the sample column.
 * @param props.tokenWidth   Width of the token column.
 */
export function TokenTable( {
	names,
	renderSample,
	sampleWidth = '25%',
	tokenWidth = '40%',
}: {
	names: readonly string[];
	renderSample: ( name: string ) => ReactNode;
	sampleWidth?: CSSProperties[ 'width' ];
	tokenWidth?: CSSProperties[ 'width' ];
} ) {
	return (
		<table className={ styles.table }>
			<thead>
				<tr>
					<th scope="col" style={ { width: sampleWidth } }>
						Sample
					</th>
					<th scope="col" style={ { width: tokenWidth } }>
						Token
					</th>
					<th scope="col">Default value</th>
				</tr>
			</thead>
			<tbody>
				{ names.map( ( name ) => (
					<tr key={ name } id={ tokenId( name ) } data-token-row="">
						<td aria-hidden="true">{ renderSample( name ) }</td>
						<td>
							<span style={ textStyle }>
								<span style={ nameRowStyle }>
									<code
										id={ `${ tokenId( name ) }-name` }
										style={ tokenNameStyle }
									>
										{ name }
									</code>
									<CopyTokenButton
										name={ name }
										describedBy={ `${ tokenId( name ) }-name` }
									/>
									<ShareTokenLink
										id={ tokenId( name ) }
										name={ name }
									/>
								</span>
								<span style={ descriptionStyle }>
									{ tokenData[ name ].$description }
								</span>
							</span>
						</td>
						<td>
							<span className={ styles.value }>
								Default value
							</span>
							<code style={ valueStyle }>
								{ tokenData[ name ].modes.default.css }
							</code>
						</td>
					</tr>
				) ) }
			</tbody>
		</table>
	);
}
