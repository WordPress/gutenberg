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

const STEM = 'sb-';

const Wrapper = styled.span( {
	flexGrow: 1,
	display: 'flex',
	paddingRight: '20px',
} );

const Title = styled.span( {
	flexGrow: 1,
} );

const Icons = styled.span( {} );

const Icon = styled.span( {} );

function useIcons( item ) {
	const api = useStorybookApi();

	return useMemo( () => {
		let data = {};

		if ( item.isComponent && item.children?.length ) {
			data = api.getData( item.children[ 0 ] ) ?? {};
		}

		const { tags = [] } = data;

		return tags
			.filter( ( tag ) => tag.startsWith( STEM ) )
			.map( ( tag ) => badges[ tag.substring( STEM.length ) ] )
			.map( ( { icon, title, tooltip } ) =>
				icon
					? createElement(
							Icon,
							{ title: tooltip?.title ?? title },
							icon
					  )
					: null
			);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ item.id ] );
}

function Label( { item } ) {
	const iconSet = useIcons( item );
	const title = createElement( Title, {}, item.name );
	const icons = createElement( Icons, { 'aria-hidden': true }, ...iconSet );

	return createElement( Wrapper, {}, title, icons );
}

export default {
	renderLabel: ( item ) => createElement( Label, { item } ),
};
