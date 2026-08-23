import type { ThemeProviderColorWarning } from '../../theme-provider-color-warnings';

export function ColorWarningDetails( {
	warnings,
}: {
	warnings: readonly ThemeProviderColorWarning[] | undefined;
} ) {
	if ( warnings === undefined ) {
		return (
			<section
				aria-label="Color warning results"
				style={ {
					background: '#f6f7f7',
					borderInlineStart: '4px solid #787c82',
					padding: '0.75rem 1rem',
				} }
			>
				<p>Calculating warnings…</p>
			</section>
		);
	}

	if ( warnings.length === 0 ) {
		return (
			<section
				aria-label="Color warning results"
				style={ {
					background: '#edfaef',
					borderInlineStart: '4px solid #00a32a',
					padding: '0.75rem 1rem',
				} }
			>
				<p>
					<strong>No warnings</strong>
				</p>
			</section>
		);
	}

	return (
		<section
			aria-label="Color warning results"
			style={ {
				background: '#fcf0f1',
				borderInlineStart: '4px solid #d63638',
				padding: '0.5rem 1rem',
			} }
		>
			<h3 style={ { marginBlock: '0.5rem' } }>
				{ warnings.length === 1
					? '1 color warning'
					: `${ warnings.length } color warnings` }
			</h3>
			<ol
				style={ {
					marginBlock: '0.5rem',
					paddingInlineStart: '1.5rem',
				} }
			>
				{ warnings.map( ( warning ) => (
					<li
						key={
							warning.type === 'ramp'
								? `ramp-${ warning.ramp }-${ warning.step }`
								: `contrast-${ warning.foregroundToken }-${ warning.backgroundToken }`
						}
					>
						{ warning.type === 'ramp' ? (
							<p style={ { marginBlock: '0.25rem' } }>
								<strong>Ramp:</strong>{ ' ' }
								<code>{ warning.ramp }</code>.{ ' ' }
								<strong>Step:</strong>{ ' ' }
								<code>{ warning.step }</code>
							</p>
						) : (
							<p style={ { marginBlock: '0.25rem' } }>
								<strong>Contrast:</strong>{ ' ' }
								<code>{ warning.foregroundToken }</code>{ ' ' }
								<code>{ warning.foregroundColor }</code> on{ ' ' }
								<code>{ warning.backgroundToken }</code>{ ' ' }
								<code>{ warning.backgroundColor }</code>.{ ' ' }
								{ warning.achievedContrast.toFixed( 2 ) }:1
								achieved; { warning.requiredContrast }:1
								required.
							</p>
						) }
					</li>
				) ) }
			</ol>
		</section>
	);
}
