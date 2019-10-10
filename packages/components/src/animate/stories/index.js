/**
 * Internal dependencies
 */
import Animate from '../';
import Notice from '../../notice';

export default { title: 'Animate', component: Animate };

export const _default = () => (
	<Animate>
		{ ( { className } ) => (
			<Notice className={ className } status="success">
				<p>No default animation. Use one of type = "appear", "slide-in", or "loading".</p>
			</Notice>
		) }
	</Animate>
);

export const appear = () => (
	<Animate type="appear">
		{ ( { className } ) => (
			<Notice className={ className } status="success">
				<p>Appear animation is meant for popover/modal content, such as menus appearing.</p>
				<p>It shows the height and width of the animated element scaling from 0 to full size, from its point of origin.</p>
			</Notice>
		) }
	</Animate>
);

export const loading = () => (
	<Animate type="loading">
		{ ( { className } ) => (
			<Notice className={ className } status="success">
				<p>Loading animation is meant to be used to indicate that activity is happening in the background.</p>
			</Notice>
		) }
	</Animate>
);

export const slideIn = () => (
	<Animate type="slide-in">
		{ ( { className } ) => (
			<Notice className={ className } status="success">
				<p>Slide-in animation is meant for sidebars and sliding menus.</p>
				<p>It shows the height and width of the animated element moving from a hidden position to its normal one.</p>
			</Notice>
		) }
	</Animate>
);
