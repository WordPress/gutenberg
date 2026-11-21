import { createContext, useContext } from '@wordpress/element';
import type { Ref } from 'react';

type BreadcrumbItemRenderContextValue = {
	itemKey: string;
	currentRef?: Ref< HTMLSpanElement >;
	variant: 'navigation' | 'selection';
	measurementRef?: Ref< HTMLSpanElement >;
	measurementVersion: number;
	mode: 'measurement' | 'overflow' | 'visible';
	onButtonActivate?: ( focusTarget: HTMLElement | null ) => void;
	onLinkBlur: ( itemKey: string ) => void;
	onLinkFocus: ( itemKey: string ) => void;
	separatorRef?: Ref< HTMLSpanElement >;
	showSeparator: boolean;
	shouldTruncateCurrent: boolean;
};

const BreadcrumbItemRenderContext =
	createContext< BreadcrumbItemRenderContextValue | null >( null );

function useBreadcrumbItemRenderContext() {
	const context = useContext( BreadcrumbItemRenderContext );

	if ( process.env.NODE_ENV !== 'production' && ! context ) {
		throw new Error(
			'Breadcrumb: <Breadcrumb.LinkItem>, <Breadcrumb.ButtonItem>, and <Breadcrumb.CurrentItem> must be direct children of <Breadcrumb.Root>.'
		);
	}

	return (
		context ?? {
			itemKey: '',
			variant: 'navigation' as const,
			measurementVersion: 0,
			mode: 'visible' as const,
			onLinkBlur: () => {},
			onLinkFocus: () => {},
			showSeparator: false,
			shouldTruncateCurrent: false,
		}
	);
}

export { BreadcrumbItemRenderContext, useBreadcrumbItemRenderContext };
export type { BreadcrumbItemRenderContextValue };
