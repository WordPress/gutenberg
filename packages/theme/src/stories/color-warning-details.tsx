import type { ThemeProviderColorWarning } from '../theme-provider-color-warnings';

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
				padding: '0.75rem 1rem',
			} }
		>
			<h3>
				{ warnings.length === 1
					? '1 color warning'
					: `${ warnings.length } color warnings` }
			</h3>
			<ol>
				{ warnings.map( ( warning ) => (
					<li
						key={
							warning.type === 'ramp'
								? `ramp-${ warning.ramp }-${ warning.step }`
								: `contrast-${ warning.foregroundToken }-${ warning.backgroundToken }`
						}
					>
						{ warning.type === 'ramp' ? (
							<p>
								<strong>Ramp warning:</strong> Ramp{ ' ' }
								<code>{ warning.ramp }</code>, step{ ' ' }
								<code>{ warning.step }</code>.
							</p>
						) : (
							<p>
								<strong>Contrast warning:</strong> Foreground
								token <code>{ warning.foregroundToken }</code> ({ ' ' }
								<code>{ warning.foregroundColor }</code> ) on
								background token{ ' ' }
								<code>{ warning.backgroundToken }</code> ({ ' ' }
								<code>{ warning.backgroundColor }</code> ).
								Required contrast: { warning.requiredContrast }
								:1. Achieved contrast:{ ' ' }
								{ warning.achievedContrast.toFixed( 2 ) }:1.
							</p>
						) }
					</li>
				) ) }
			</ol>
		</section>
	);
}
