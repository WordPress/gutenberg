import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Spinner } from '../../spinner';
import { Text } from '../../text';
import type { LoadingIndicatorProps } from './types';
import itemPopupStyles from '../css/item-popup.module.css';
import resetStyles from '../css/resets.module.css';

export const LoadingIndicator = forwardRef<
	HTMLDivElement,
	LoadingIndicatorProps
>( function ItemPopupLoadingIndicator(
	{ children = __( 'Loading…' ), render, ...props },
	ref
) {
	return useRender( {
		defaultTagName: 'div',
		render,
		ref,
		props: mergeProps< 'div' >( props, {
			className: clsx(
				resetStyles[ 'box-sizing' ],
				itemPopupStyles[ 'loading-indicator' ]
			),
			children: (
				<>
					<span className={ itemPopupStyles[ 'item-icon' ] }>
						<Spinner aria-hidden="true" />
					</span>
					<Text className={ itemPopupStyles[ 'item-label' ] }>
						{ children }
					</Text>
				</>
			),
		} ),
	} );
} );
