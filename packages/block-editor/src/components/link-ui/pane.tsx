import type { ReactNode } from 'react';
import clsx from 'clsx';
import { Button } from '@wordpress/components';
import { __, isRTL } from '@wordpress/i18n';
import { chevronLeftSmall, chevronRightSmall } from '@wordpress/icons';
import { useInstanceId, useFocusOnMount } from '@wordpress/compose';
import { VisuallyHidden } from '@wordpress/ui';

interface LinkUIPaneProps {
	className?: string;
	/**
	 * Dialog title read by assistive technology.
	 */
	title: string;
	/**
	 * Dialog description read by assistive technology.
	 */
	description: string;
	onBack: () => void;
	children: ReactNode;
}

/**
 * A pane that replaces the link search, with a Back button that returns to
 * it. Focus lands on the Back button when the pane opens.
 */
export function LinkUIPane( {
	className,
	title,
	description,
	onBack,
	children,
}: LinkUIPaneProps ) {
	const titleId = useInstanceId(
		LinkUIPane,
		'block-editor-link-ui-pane__title'
	);
	const descriptionId = useInstanceId(
		LinkUIPane,
		'block-editor-link-ui-pane__description'
	);
	const focusOnMountRef = useFocusOnMount( 'firstElement' );

	return (
		<div
			className={ clsx( 'block-editor-link-ui-pane', className ) }
			role="dialog"
			aria-labelledby={ titleId }
			aria-describedby={ descriptionId }
			ref={ focusOnMountRef }
		>
			<VisuallyHidden>
				<h2 id={ titleId }>{ title }</h2>
				<p id={ descriptionId }>{ description }</p>
			</VisuallyHidden>

			<Button
				className="block-editor-link-ui-pane__back"
				icon={ isRTL() ? chevronRightSmall : chevronLeftSmall }
				onClick={ ( event: React.MouseEvent ) => {
					event.preventDefault();
					onBack();
				} }
				size="small"
			>
				{ __( 'Back' ) }
			</Button>

			{ children }
		</div>
	);
}
