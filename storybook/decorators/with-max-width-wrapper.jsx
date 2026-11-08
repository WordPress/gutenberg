import styles from './with-max-width-wrapper.module.scss';

const maxWidthWrapperMap = {
	none: 0,
	'wordpress-sidebar': 248,
	'small-container': 600,
	'large-container': 960,
};

export const WithMaxWidthWrapper = ( Story, context ) => {
	/**
	 * A Storybook decorator to wrap a story in a div applying a max width.
	 * This can be used to simulate real world constraints on components
	 * such as being located within the WordPress editor sidebars.
	 */
	const maxWidth = maxWidthWrapperMap[ context.globals.maxWidthWrapper ];
	if ( ! maxWidth ) {
		return <Story { ...context } />;
	}
	return (
		<div style={ { maxWidth } }>
			<Story { ...context } />
			<div
				className={ styles.indicator }
			>{ `Max-Width Wrapper - ${ maxWidth }px` }</div>
		</div>
	);
};
