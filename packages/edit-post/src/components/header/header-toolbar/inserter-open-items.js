/**
 * WordPress dependencies
 */
import { useReducedMotion } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import {
	Button,
	ToolbarItem,
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
} from '@wordpress/components';
import { paragraph, heading, list, image } from '@wordpress/icons';

const BUTTON_CONTAINER_VARIANTS = {
	hidden: {
		opacity: 0,
	},
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.05,
			staggerDirection: 1,
		},
	},
	exit: {
		opacity: 0,
		transition: {
			staggerChildren: 0.05,
			staggerDirection: -1,
		},
	},
};

const BUTTON_ANIMATION_VARIANTS = {
	hidden: {
		x: -40,
		opacity: 0,
	},
	visible: {
		x: 0,
		opacity: 1,
	},
	exit: {
		x: -40,
		opacity: 0,
		transition: {
			duration: 0.05,
		},
	},
};

const preventDefault = ( event ) => {
	event.preventDefault();
};

export default function InserterOpenItems( {
	isInserterOpened,
	showIconLabels,
} ) {
	const isReducedMotion = useReducedMotion();
	const containerVariants = isReducedMotion
		? undefined
		: BUTTON_CONTAINER_VARIANTS;
	const itemVariants = isReducedMotion
		? undefined
		: BUTTON_ANIMATION_VARIANTS;

	return (
		<AnimatePresence>
			{ isInserterOpened && (
				<motion.div
					initial={ 'hidden' }
					animate={ 'visible' }
					exit={ 'exit' }
					variants={ containerVariants }
					className="edit-post-header-toolbar__inserter-open-items"
				>
					<motion.div
						variants={ itemVariants }
						className="edit-post-header-toolbar__animated-button-container"
					>
						<ToolbarItem
							as={ Button }
							className="edit-post-header-toolbar__insert-block"
							variant="secondary"
							icon={ paragraph }
							label={ __( 'Insert Paragraph Block' ) }
							showTooltip={ ! showIconLabels }
							onMouseDown={ preventDefault }
						/>
					</motion.div>

					<motion.div
						variants={ itemVariants }
						className="edit-post-header-toolbar__animated-button-container"
					>
						<ToolbarItem
							as={ Button }
							className="edit-post-header-toolbar__insert-block"
							variant="secondary"
							icon={ heading }
							label={ __( 'Insert Heading Block' ) }
							showTooltip={ ! showIconLabels }
							onMouseDown={ preventDefault }
						/>
					</motion.div>

					<motion.div
						variants={ itemVariants }
						className="edit-post-header-toolbar__animated-button-container"
					>
						<ToolbarItem
							as={ Button }
							className="edit-post-header-toolbar__insert-block"
							variant="secondary"
							icon={ list }
							label={ __( 'Insert List Block' ) }
							showTooltip={ ! showIconLabels }
							onMouseDown={ preventDefault }
						/>
					</motion.div>

					<motion.div
						variants={ itemVariants }
						className="edit-post-header-toolbar__animated-button-container"
					>
						<ToolbarItem
							as={ Button }
							className="edit-post-header-toolbar__insert-block"
							variant="secondary"
							icon={ image }
							label={ __( 'Insert Image Block' ) }
							showTooltip={ ! showIconLabels }
							onMouseDown={ preventDefault }
						/>
					</motion.div>

					{ /* <ToolbarItem
						as={ EditorHistoryUndo }
						showTooltip={ ! showIconLabels }
						variant={ showIconLabels ? 'tertiary' : undefined }
					/>
					<ToolbarItem
						as={ EditorHistoryRedo }
						showTooltip={ ! showIconLabels }
						variant={ showIconLabels ? 'tertiary' : undefined }
					/> */ }
				</motion.div>
			) }
		</AnimatePresence>
	);
}
