// Minimal module declaration for @wordpress/interface, which ships without
// TypeScript types. Keep this narrow to what media-editor actually consumes.
declare module '@wordpress/interface' {
	import type { ComponentType, ReactNode } from 'react';

	export interface InterfaceSkeletonProps {
		className?: string;
		isDistractionFree?: boolean;
		header?: ReactNode;
		editorNotices?: ReactNode;
		content?: ReactNode;
		sidebar?: ReactNode;
		secondarySidebar?: ReactNode;
		footer?: ReactNode;
		actions?: ReactNode;
		labels?: {
			header?: string;
			body?: string;
			sidebar?: string;
			secondarySidebar?: string;
			actions?: string;
			footer?: string;
		};
	}

	export const InterfaceSkeleton: ComponentType< InterfaceSkeletonProps >;
}
