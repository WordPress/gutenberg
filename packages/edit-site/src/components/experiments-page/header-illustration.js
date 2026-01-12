/**
 * Header illustration component - modern abstract experimental design.
 */
export default function HeaderIllustration() {
	return (
		<svg
			className="header-illustration"
			viewBox="0 0 160 160"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			role="presentation"
			focusable="false"
		>
			<defs>
				<linearGradient
					id="flask-gradient"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="100%"
				>
					<stop
						offset="0%"
						stopColor="var(--wp-admin-theme-color, #3858e9)"
						stopOpacity="0.15"
					/>
					<stop
						offset="100%"
						stopColor="var(--wp-admin-theme-color, #3858e9)"
						stopOpacity="0.05"
					/>
				</linearGradient>
				<linearGradient
					id="liquid-gradient"
					x1="0%"
					y1="0%"
					x2="0%"
					y2="100%"
				>
					<stop
						offset="0%"
						stopColor="var(--wp-admin-theme-color, #3858e9)"
						stopOpacity="0.3"
					/>
					<stop
						offset="100%"
						stopColor="var(--wp-admin-theme-color, #3858e9)"
						stopOpacity="0.5"
					/>
				</linearGradient>
			</defs>

			{ /* Background circle */ }
			<circle cx="80" cy="80" r="70" fill="url(#flask-gradient)" />

			{ /* Modern flask shape */ }
			<g className="header-illustration__flask-group">
				{ /* Flask body */ }
				<path
					d="M60 35 L60 65 L40 115 C36 125 44 135 55 135 L105 135 C116 135 124 125 120 115 L100 65 L100 35"
					fill="#fff"
					stroke="var(--wp-admin-theme-color, #3858e9)"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>

				{ /* Flask neck */ }
				<rect
					x="58"
					y="28"
					width="44"
					height="10"
					rx="2"
					fill="#fff"
					stroke="var(--wp-admin-theme-color, #3858e9)"
					strokeWidth="2.5"
				/>

				{ /* Liquid */ }
				<path
					className="header-illustration__liquid"
					d="M48 105 L55 90 Q80 82 105 90 L112 105 L120 115 C124 125 116 135 105 135 L55 135 C44 135 36 125 40 115 Z"
					fill="url(#liquid-gradient)"
				/>

				{ /* Bubbles inside */ }
				<circle
					className="header-illustration__bubble header-illustration__bubble--1"
					cx="65"
					cy="115"
					r="4"
					fill="var(--wp-admin-theme-color, #3858e9)"
					opacity="0.4"
				/>
				<circle
					className="header-illustration__bubble header-illustration__bubble--2"
					cx="80"
					cy="120"
					r="3"
					fill="var(--wp-admin-theme-color, #3858e9)"
					opacity="0.5"
				/>
				<circle
					className="header-illustration__bubble header-illustration__bubble--3"
					cx="95"
					cy="112"
					r="5"
					fill="var(--wp-admin-theme-color, #3858e9)"
					opacity="0.35"
				/>
			</g>

			{ /* Floating elements */ }
			<g className="header-illustration__floaters">
				{ /* Floating dot 1 */ }
				<circle
					className="header-illustration__float header-illustration__float--1"
					cx="30"
					cy="50"
					r="4"
					fill="var(--wp-admin-theme-color, #3858e9)"
					opacity="0.6"
				/>

				{ /* Floating dot 2 */ }
				<circle
					className="header-illustration__float header-illustration__float--2"
					cx="130"
					cy="45"
					r="3"
					fill="var(--wp-admin-theme-color, #3858e9)"
					opacity="0.4"
				/>

				{ /* Floating dot 3 */ }
				<circle
					className="header-illustration__float header-illustration__float--3"
					cx="140"
					cy="90"
					r="5"
					fill="var(--wp-admin-theme-color, #3858e9)"
					opacity="0.25"
				/>

				{ /* Small plus sign */ }
				<g
					className="header-illustration__float header-illustration__float--4"
					opacity="0.5"
				>
					<line
						x1="22"
						y1="95"
						x2="32"
						y2="95"
						stroke="var(--wp-admin-theme-color, #3858e9)"
						strokeWidth="2"
						strokeLinecap="round"
					/>
					<line
						x1="27"
						y1="90"
						x2="27"
						y2="100"
						stroke="var(--wp-admin-theme-color, #3858e9)"
						strokeWidth="2"
						strokeLinecap="round"
					/>
				</g>

				{ /* Small ring */ }
				<circle
					className="header-illustration__float header-illustration__float--5"
					cx="125"
					cy="130"
					r="6"
					fill="none"
					stroke="var(--wp-admin-theme-color, #3858e9)"
					strokeWidth="2"
					opacity="0.3"
				/>
			</g>
		</svg>
	);
}
