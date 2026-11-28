/**
 * Provides sidebar configuration options.
 * See https://storybook.js.org/docs/configure/features-and-behavior
 */
import { createElement, useMemo } from 'react';
import { useStorybookApi } from 'storybook/manager-api';
import { styled } from 'storybook/theming';
import badges from './badges';

const Wrapper = styled.span( {
	flexGrow: 1,
	display: 'flex',
	paddingRight: '20px',
} );

const Title = styled.span( {
	flexGrow: 1,
} );

const Icons = styled.span( {} );

const Icon = styled.span( {
	lineHeight: 1,
} );

// Storybook treats slashes as hierarchy separators, so story titles use
// internal keys and the sidebar restores the exact npm package names.
const PACKAGE_LABELS = {
	'@wordpress-ui': '@wordpress/ui',
	'@wordpress-components': '@wordpress/components',
};

/**
 * Fetches tags from the Storybook API, and returns Icon
 * elements for any that have matching badge data
 */
function useIcons( item ) {
	const api = useStorybookApi();

	return useMemo( () => {
		let data = {};

		if ( item.type === 'component' && item.children?.length ) {
			data = api.getData( item.children[ 0 ] ) ?? {};
		}

		const { tags = [] } = data;

		// The indexer appends the recommendation tag after the hand-declared
		// ones, so the lifecycle icon comes first.
		return tags
			.map( ( tag ) => badges[ tag ] )
			.filter( Boolean )
			.map( ( { icon, title, tooltip } ) =>
				icon
					? createElement(
							Icon,
							{ title: tooltip?.title ?? title },
							icon
						)
					: null
			);
	}, [ api, item.children, item.type ] );
}

/**
 * Renders the item name and any associated badge icons.
 */
function Label( { item } ) {
	const iconSet = useIcons( item );
	const title = createElement(
		Title,
		{},
		PACKAGE_LABELS[ item.name ] ?? item.name
	);
	const icons = createElement( Icons, { 'aria-hidden': true }, ...iconSet );

	return createElement( Wrapper, {}, title, icons );
}

export default {
	// Renders an icon for each tag that has a badge definition
	renderLabel: ( item ) => createElement( Label, { item } ),

	// Renders sections as collapsed by default
	showRoots: false,
};
