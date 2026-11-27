export default function WelcomeGuideImage( { nonAnimatedSrc, animatedSrc } ) {
	return (
		<picture className="edit-post-welcome-guide__image">
			<source
				srcSet={ nonAnimatedSrc }
				media="(prefers-reduced-motion: reduce)"
			/>
			<img src={ animatedSrc } width="312" height="240" alt="" />
		</picture>
	);
}
