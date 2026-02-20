import type { Meta, StoryObj } from '@storybook/react-vite';
import colorTokens from '../../prebuilt/ts/color-tokens';
import _tokenFallbacks from '../../prebuilt/js/design-token-fallbacks.mjs';
import { ThemeProvider } from '../../theme-provider';

const tokenFallbacks: Record< string, string > = _tokenFallbacks;

type BrandToken = {
	cssVarName: string;
	fallbackExpr: string;
};

function getBrandTokens(): BrandToken[] {
	const tokens: BrandToken[] = [];

	for ( const [ rampKey, tokenNames ] of Object.entries( colorTokens ) ) {
		if ( ! rampKey.startsWith( 'primary-' ) ) {
			continue;
		}

		for ( const tokenName of tokenNames ) {
			const cssVarName = `--wpds-color-${ tokenName }`;
			tokens.push( {
				cssVarName,
				fallbackExpr: tokenFallbacks[ cssVarName ] ?? '',
			} );
		}
	}

	return tokens.sort( ( a, b ) =>
		a.cssVarName.localeCompare( b.cssVarName )
	);
}

const brandTokens = getBrandTokens();

type VerifierProps = { adminThemeColor: string };
const Verifier: React.FC< VerifierProps > = () => null;

/**
 * Compares actual brand token values (computed by ThemeProvider using the full
 * ramp algorithm) against their `color-mix()` fallback approximations driven
 * by `--wp-admin-theme-color`. Use the color picker to switch admin color
 * schemes and observe how closely the fallbacks track the real values.
 */
const meta: Meta< typeof Verifier > = {
	title: 'Design System/Theme/Theme Provider/Brand Color Fallbacks',
	component: Verifier,
	argTypes: {
		adminThemeColor: {
			control: {
				type: 'color',
				presetColors: [
					'#3858e9', // modern
					'#0085ba', // light
					'#096484', // blue
					'#46403c', // coffee
					'#523f6d', // ectoplasm
					'#e14d43', // midnight
					'#627c83', // ocean
					'#dd823b', // sunrise
				],
			},
		},
	},
	parameters: {
		controls: { expanded: true },
	},
};
export default meta;

export const Default: StoryObj< typeof Verifier > = {
	render: ( { adminThemeColor } ) => (
		<div
			style={
				{
					'--wp-admin-theme-color': adminThemeColor,
					fontSize: 13,
				} as React.CSSProperties
			}
		>
			<p
				style={ {
					margin: '0 0 16px',
					color: '#757575',
					fontSize: 12,
				} }
			>
				<strong>Actual:</strong> real token value from ThemeProvider
				(ramp algorithm). <strong>Fallback:</strong> approximation via{ ' ' }
				<code>color-mix()</code> and <code>--wp-admin-theme-color</code>
				.
			</p>
			<ThemeProvider color={ { primary: adminThemeColor } }>
				<div
					style={ {
						display: 'grid',
						gridTemplateColumns: '40px 40px 1fr 1fr',
						gap: '4px 12px',
						alignItems: 'center',
					} }
				>
					<div style={ headerStyle }>Actual</div>
					<div style={ headerStyle }>Fallback</div>
					<div style={ headerStyle }>Token</div>
					<div style={ headerStyle }>Fallback expression</div>
					{ brandTokens.map( ( { cssVarName, fallbackExpr } ) => (
						<Row
							key={ cssVarName }
							cssVarName={ cssVarName }
							fallbackExpr={ fallbackExpr }
						/>
					) ) }
				</div>
			</ThemeProvider>
		</div>
	),
	args: {
		adminThemeColor: '#3858e9',
	},
};

const headerStyle: React.CSSProperties = {
	fontSize: 11,
	fontWeight: 600,
	color: '#757575',
	paddingBottom: 4,
	borderBottom: '1px solid #e0e0e0',
};

function Row( { cssVarName, fallbackExpr }: BrandToken ) {
	return (
		<>
			<Swatch
				color={ `var(${ cssVarName })` }
				title={ `${ cssVarName } (actual)` }
			/>
			<Swatch color={ fallbackExpr } title="Fallback (rendered)" />
			<code style={ { fontSize: 12 } }>{ cssVarName }</code>
			<code
				style={ {
					fontSize: 11,
					color: '#555',
					wordBreak: 'break-all',
				} }
			>
				{ fallbackExpr }
			</code>
		</>
	);
}

function Swatch( { color, title }: { color: string; title: string } ) {
	return (
		<div
			title={ title }
			style={ {
				backgroundColor: color,
				width: 40,
				height: 28,
				border: '1px solid rgba(0, 0, 0, 0.1)',
			} }
		/>
	);
}
