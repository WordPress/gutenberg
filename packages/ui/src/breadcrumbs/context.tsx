import { createContext, useContext } from '@wordpress/element';

type BreadcrumbItemRenderContextValue = {
	itemKey: string;
	measurementVersion: number;
	mode: 'visible' | 'overflow';
	onLinkBlur: ( itemKey: string ) => void;
	onLinkFocus: ( itemKey: string ) => void;
	showSeparator: boolean;
	shouldTruncateCurrent: boolean;
};

const BreadcrumbItemRenderContext =
	createContext< BreadcrumbItemRenderContextValue | null >( null );

function useBreadcrumbItemRenderContext() {
	const context = useContext( BreadcrumbItemRenderContext );

	if ( process.env.NODE_ENV !== 'production' && ! context ) {
		throw new Error(
			'Breadcrumbs: <Breadcrumbs.LinkItem> and <Breadcrumbs.CurrentItem> must be direct children of <Breadcrumbs.Root>.'
		);
	}

	return (
		context ?? {
			itemKey: '',
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
