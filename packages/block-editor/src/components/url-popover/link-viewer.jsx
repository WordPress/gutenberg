import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { pencil } from '@wordpress/icons';
import LinkViewerURL from './link-viewer-url';

export default function LinkViewer( {
	className,
	linkClassName,
	onEditLinkClick,
	url,
	urlLabel,
	...props
} ) {
	return (
		<div
			className={ clsx(
				'block-editor-url-popover__link-viewer',
				className
			) }
			{ ...props }
		>
			<LinkViewerURL
				url={ url }
				urlLabel={ urlLabel }
				className={ linkClassName }
			/>
			{ onEditLinkClick && (
				<Button
					icon={ pencil }
					label={ __( 'Edit' ) }
					onClick={ onEditLinkClick }
					size="compact"
				/>
			) }
		</div>
	);
}
