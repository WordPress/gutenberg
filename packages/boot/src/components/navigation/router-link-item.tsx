import type { ForwardedRef } from 'react';
import { forwardRef } from '@wordpress/element';
import { __experimentalItem as WCItem } from '@wordpress/components';
import { privateApis as routePrivateApis } from '@wordpress/route';
import { unlock } from '../../lock-unlock';

const { createLink } = unlock( routePrivateApis );

function AnchorOnlyItem(
	props: React.ComponentProps< typeof WCItem >,
	forwardedRef: ForwardedRef< HTMLAnchorElement >
) {
	return <WCItem as="a" ref={ forwardedRef } { ...props } />;
}

const RouterLinkItem = createLink( forwardRef( AnchorOnlyItem ) );

export default RouterLinkItem;
