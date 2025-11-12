/**
 * External dependencies
 */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import React from 'react';

export const TokensTable = ( { tokenCategory, tokens, applyTokenStyle } ) => {
	return (
		<table style={ { width: '100%' } }>
			<thead>
				<tr>
					<th>Token</th>
					<th>Value</th>
					<th>Example</th>
				</tr>
			</thead>
			<tbody>
				{ tokens.map( ( { name, valueShow, valueCode } ) => (
					<tr key={ name }>
						<td style={ { whiteSpace: 'nowrap' } }>{ name }</td>
						<td>
							<code
								style={ {
									lineHeight: 1,
									margin: '0 2px',
									padding: '3px 5px',
									borderRadius: '3px',
									fontSize: '13px',
									border: '1px solid #ECF4F9',
									color: 'rgba(46, 52, 56, 0.9)',
									backgroundColor: '#F7FAFC',
								} }
							>
								{ valueShow }
							</code>
						</td>
						<td style={ { padding: '24px' } }>
							<div
								aria-label={ `A shape showing an example of the '${ name }' ${ tokenCategory } token` }
								style={ {
									width: '100px',
									height: '100px',
									background: 'white',
									...applyTokenStyle( valueCode ),
								} }
							></div>
						</td>
					</tr>
				) ) }
			</tbody>
		</table>
	);
};
