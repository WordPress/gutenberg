/**
 * Internal dependencies
 */
import Animate from '../';
import Notice from '../../notice';

export default { title: 'Components/Animate', component: Animate };

export const _default = () => (
	<Animate>
		{ ( { className } ) => (
			<Notice className={ className } status="success">
				<p>{ `No default animation. Use one of type = "appear", "slide-in", or "loading".` }</p>
			</Notice>
		) }
	</Animate>
);

// Unexported helper for different origins.
const Appear = ( { origin } ) => (
	<Animate type="appear" options={ { origin } }>
		<Notice status="success">
			<p>Appear animation. Origin: { origin }.</p>
		</Notice>
	</Animate>
);

export const appearTopLeft = () => <Appear origin="top left" />;
export const appearTopRight = () => <Appear origin="top right" />;
export const appearBottomLeft = () => <Appear origin="bottom left" />;
export const appearBottomRight = () => <Appear origin="bottom right" />;
export const appearCenterCenter = () => <Appear origin="center center" />;
export const deprecatedAppearMiddleCenter = () => (
	<Appear origin="middle center" />
);

export const loading = () => (
	<Animate type="loading">
		{ ( { className } ) => (
			<Notice className={ className } status="success">
				<p>Loading animation.</p>
			</Notice>
		) }
	</Animate>
);

export const slideInLeft = () => (
	<Animate type="slide-in">
		{ ( { className } ) => (
			<Notice className={ className } status="success">
				<p>Slide-in animation.</p>
			</Notice>
		) }
	</Animate>
);

export const slideInRight = () => (
	<Animate type="slide-in" options={ { origin: 'right' } }>
		{ ( { className } ) => (
			<Notice className={ className } status="success">
				<p>Slide-in animation.</p>
			</Notice>
		) }
	</Animate>
);
