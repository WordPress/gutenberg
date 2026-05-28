/**
 * WordPress dependencies
 */
import { useId } from '@wordpress/element';
import {
	SVG,
	G,
	Path,
	Defs,
	LinearGradient,
	RadialGradient,
	Stop,
} from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import styles from './header-background.module.css';

export function HeaderBackground() {
	const idBase = useId();
	const clipId = `${ idBase }-clip`;
	const maskId = `${ idBase }-mask`;
	const radialId = `${ idBase }-radial`;
	const fadeId = `${ idBase }-fade`;
	const lineIds = [ 1, 2, 3, 4, 5 ].map(
		( index ) => `${ idBase }-line-${ index }`
	);

	return (
		<SVG
			className={ styles.root }
			preserveAspectRatio="xMidYMin slice"
			fill="none"
			viewBox="0 0 1232 240"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			focusable="false"
		>
			<G clipPath={ `url(#${ clipId })` }>
				<Path fill="var(--banner-bg)" d="M0 0h1232v240H0z" />

				<ellipse
					cx="616"
					cy="232"
					fill={ `url(#${ radialId })` }
					opacity=".05"
					rx="1497"
					ry="249"
				/>

				<mask
					id={ maskId }
					width="1000"
					height="400"
					x="232"
					y="20"
					maskUnits="userSpaceOnUse"
					style={ { maskType: 'alpha' } }
				>
					<Path
						fill={ `url(#${ fadeId })` }
						d="M0 0h1000v400H0z"
						transform="translate(232 20)"
					/>
				</mask>

				<G strokeWidth="2" mask={ `url(#${ maskId })` }>
					<Path
						stroke={ `url(#${ lineIds[ 0 ] })` }
						d="M387 20v1635"
					/>
					<Path
						stroke={ `url(#${ lineIds[ 1 ] })` }
						d="M559.5 20v1635"
					/>
					<Path
						stroke={ `url(#${ lineIds[ 2 ] })` }
						d="M732 20v1635"
					/>
					<Path
						stroke={ `url(#${ lineIds[ 3 ] })` }
						d="M904.5 20v1635"
					/>
					<Path
						stroke={ `url(#${ lineIds[ 4 ] })` }
						d="M1077 20v1635"
					/>
				</G>
			</G>

			<Defs>
				<LinearGradient
					id={ lineIds[ 0 ] }
					x1="387.5"
					x2="387.5"
					y1="20"
					y2="1655"
					gradientUnits="userSpaceOnUse"
				>
					<Stop
						stopColor="var(--banner-line-brand)"
						stopOpacity="0"
					/>
					<Stop offset=".297" stopColor="var(--banner-line-brand)" />
					<Stop offset=".734" stopColor="var(--banner-line-brand)" />
					<Stop
						offset="1"
						stopColor="var(--banner-line-brand)"
						stopOpacity="0"
					/>
				</LinearGradient>

				<LinearGradient
					id={ lineIds[ 1 ] }
					x1="560"
					x2="560"
					y1="20"
					y2="1655"
					gradientUnits="userSpaceOnUse"
				>
					<Stop
						stopColor="var(--banner-line-caution)"
						stopOpacity="0"
					/>
					<Stop
						offset=".297"
						stopColor="var(--banner-line-caution)"
					/>
					<Stop
						offset=".734"
						stopColor="var(--banner-line-caution)"
					/>
					<Stop
						offset="1"
						stopColor="var(--banner-line-caution)"
						stopOpacity="0"
					/>
				</LinearGradient>

				<LinearGradient
					id={ lineIds[ 2 ] }
					x1="732.5"
					x2="732.5"
					y1="20"
					y2="1655"
					gradientUnits="userSpaceOnUse"
				>
					<Stop
						stopColor="var(--banner-line-success)"
						stopOpacity="0"
					/>
					<Stop
						offset=".297"
						stopColor="var(--banner-line-success)"
					/>
					<Stop
						offset=".693"
						stopColor="var(--banner-line-success)"
					/>
					<Stop
						offset="1"
						stopColor="var(--banner-line-success)"
						stopOpacity="0"
					/>
				</LinearGradient>

				<LinearGradient
					id={ lineIds[ 3 ] }
					x1="905"
					x2="905"
					y1="20"
					y2="1655"
					gradientUnits="userSpaceOnUse"
				>
					<Stop
						stopColor="var(--banner-line-error)"
						stopOpacity="0"
					/>
					<Stop offset=".297" stopColor="var(--banner-line-error)" />
					<Stop offset=".734" stopColor="var(--banner-line-error)" />
					<Stop
						offset="1"
						stopColor="var(--banner-line-error)"
						stopOpacity="0"
					/>
				</LinearGradient>

				<LinearGradient
					id={ lineIds[ 4 ] }
					x1="1077.5"
					x2="1077.5"
					y1="20"
					y2="1655"
					gradientUnits="userSpaceOnUse"
				>
					<Stop stopColor="var(--banner-line-info)" stopOpacity="0" />
					<Stop offset=".297" stopColor="var(--banner-line-info)" />
					<Stop offset=".734" stopColor="var(--banner-line-info)" />
					<Stop
						offset="1"
						stopColor="var(--banner-line-info)"
						stopOpacity="0"
					/>
				</LinearGradient>

				<RadialGradient
					id={ radialId }
					cx="0"
					cy="0"
					r="1"
					gradientTransform="matrix(0 249 -1497 0 616 232)"
					gradientUnits="userSpaceOnUse"
				>
					<Stop stopColor="var(--banner-line-brand)" />
					<Stop
						offset="1"
						stopColor="var(--banner-bg)"
						stopOpacity="0"
					/>
				</RadialGradient>

				<RadialGradient
					id={ fadeId }
					cx="0"
					cy="0"
					r="1"
					gradientTransform="matrix(0 765 -1912.5 0 500 -110)"
					gradientUnits="userSpaceOnUse"
				>
					<Stop
						offset=".161"
						stopColor="var(--banner-bg)"
						stopOpacity="0"
					/>
					<Stop offset=".682" stopColor="var(--banner-bg)" />
				</RadialGradient>

				<clipPath id={ clipId }>
					<Path fill="var(--banner-fg)" d="M0 0h1232v240H0z" />
				</clipPath>
			</Defs>
		</SVG>
	);
}
