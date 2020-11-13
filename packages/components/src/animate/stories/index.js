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
	<Animate type="appear" origin={ origin }>
		{ ( { className } ) => (
			<Notice className={ className } status="success">
				<p>Appear animation. Origin: { origin }.</p>
			</Notice>
		) }
	</Animate>
);

export const appearTopLeft = () => <Appear origin="top left" />;
export const appearTopRight = () => <Appear origin="top right" />;
export const appearBottomLeft = () => <Appear origin="bottom left" />;
export const appearBottomRight = () => <Appear origin="bottom right" />;
export const appearMiddle = () => <Appear origin="middle" />;
export const appearMiddleLeft = () => <Appear origin="middle left" />;
export const appearMiddleRight = () => <Appear origin="middle right" />;

export const loading = () => (
	<Animate type="loading">
		{ ( { className } ) => (
			<Notice className={ className } status="success">
				<p>Loading animation.</p>
			</Notice>
		) }
	</Animate>
);

const SlideIn = ( { origin } ) => (
	<Animate type="slide-in" origin={ origin }>
		{ ( { className } ) => (
			<Notice className={ className } status="success">
				<p>Slide-in animation. Origin: { origin }.</p>
			</Notice>
		) }
	</Animate>
);

export const slideInLeft = () => <SlideIn origin="left" />;
export const slideInight = () => <SlideIn origin="right" />;
