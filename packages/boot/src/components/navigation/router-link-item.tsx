import type { ForwardedRef } from 'react';
import { forwardRef } from '@wordpress/element';
import { __experimentalItem as Item } from '@wordpress/components';
import { privateApis as routePrivateApis } from '@wordpress/route';
import { unlock } from '../../lock-unlock';

const { createLink } = unlock( routePrivateApis );

function AnchorOnlyItem(
	props: React.ComponentProps< typeof Item >,
	forwardedRef: ForwardedRef< HTMLAnchorElement >
) {
	return <Item as="a" ref={ forwardedRef } { ...props } />;
}

const RouterLinkItem = createLink( forwardRef( AnchorOnlyItem ) );

export default RouterLinkItem;
