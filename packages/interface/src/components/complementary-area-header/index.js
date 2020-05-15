/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { close } from '@wordpress/icons';

const ComplementaryAreaHeader = ( {
	smallScreenTitle,
	toggleShortcut,
	onClose,
	children,
	className,
	closeLabel,
} ) => {
	return (
		<>
			<div className="components-panel__header interface-complementary-area-header__small">
				{ smallScreenTitle && (
					<span className="interface-complementary-area-header__small-title">
						{ smallScreenTitle }
					</span>
				) }
				<Button
					onClick={ onClose }
					icon={ close }
					label={ closeLabel }
				/>
			</div>
			<div
				className={ classnames(
					'components-panel__header',
					'interface-complementary-area-header',
					className
				) }
				tabIndex={ -1 }
			>
				{ children }
				<Button
					onClick={ onClose }
					icon={ close }
					label={ closeLabel }
					shortcut={ toggleShortcut }
				/>
			</div>
		</>
	);
};

export default ComplementaryAreaHeader;
