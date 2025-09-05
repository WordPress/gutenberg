/**
 * Provides sidebar configuration options.
 * See https://storybook.js.org/docs/configure/features-and-behavior
 */

/**
 * External dependencies
 */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { createElement, useMemo } from 'react';
import { useStorybookApi } from '@storybook/manager-api';
import { styled } from '@storybook/theming';

/**
 * Internal dependencies
 */
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

/**
 * Fetches tags from the Storybook API, and returns Icon
 * elements for any that have matching badge data
 */
function useIcons( item ) {
	const api = useStorybookApi();
	const prefix = 'status-';

	return useMemo( () => {
		let data = {};

		if ( item.type === 'component' && item.children?.length ) {
			data = api.getData( item.children[ 0 ] ) ?? {};
		}

		const { tags = [] } = data;

		return tags
			.filter( ( tag ) => tag.startsWith( prefix ) )
			.map( ( tag ) => badges[ tag.substring( prefix.length ) ] )
			.map( ( { icon, title, tooltip } ) =>
				icon
					? createElement(
							Icon,
							{ title: tooltip?.title ?? title },
							icon
					  )
					: null
			);
	}, [ api, item.children, item.isComponent ] );
}

/**
 * Renders the item name and any associated badge icons.
 */
function Label( { item } ) {
	const iconSet = useIcons( item );
	const title = createElement( Title, {}, item.name );
	const icons = createElement( Icons, { 'aria-hidden': true }, ...iconSet );

	return createElement( Wrapper, {}, title, icons );
}

export default {
	// Renders status icons for items tagged with `status-*`
	renderLabel: ( item ) => createElement( Label, { item } ),
};
