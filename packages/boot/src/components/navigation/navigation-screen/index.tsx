/**
 * External dependencies
 */
import type { ReactNode, RefObject } from 'react';

/**
 * WordPress dependencies
 */
import {
	__experimentalHeading as Heading,
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
	Button,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
import { chevronRight, chevronLeft } from '@wordpress/icons';
import { useReducedMotion } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import './style.scss';

const ANIMATION_DURATION = 0.3;
const slideVariants = {
	initial: ( direction: 'forward' | 'backward' ) => ( {
		x: direction === 'forward' ? 100 : -100,
		opacity: 0,
	} ),
	animate: {
		x: 0,
		opacity: 1,
	},
	exit: ( direction: 'forward' | 'backward' ) => ( {
		x: direction === 'forward' ? 100 : -100,
		opacity: 0,
	} ),
};

export default function NavigationScreen( {
	isRoot,
	title,
	actions,
	content,
	description,
	animationDirection,
	backMenuItem,
	backButtonRef,
	navigationKey,
	onNavigate,
}: {
	isRoot?: boolean;
	title: string;
	actions?: ReactNode;
	content: ReactNode;
	description?: ReactNode;
	backMenuItem?: string;
	backButtonRef?: RefObject< HTMLButtonElement | null >;
	animationDirection?: 'forward' | 'backward';
	navigationKey?: string;
	onNavigate: ( {
		id,
		direction,
	}: {
		id?: string;
		direction: 'forward' | 'backward';
	} ) => void;
} ) {
	const icon = isRTL() ? chevronRight : chevronLeft;
	const disableMotion = useReducedMotion();

	const handleBackClick = ( e: React.MouseEvent ) => {
		e.preventDefault();
		onNavigate( { id: backMenuItem, direction: 'backward' } );
	};

	return (
		<div
			className="boot-navigation-screen"
			style={ {
				overflow: 'hidden',
				position: 'relative',
				display: 'grid',
				gridTemplateColumns: '1fr',
				gridTemplateRows: '1fr',
			} }
		>
			<AnimatePresence initial={ false }>
				<motion.div
					key={ navigationKey }
					custom={ animationDirection }
					variants={ slideVariants }
					initial="initial"
					animate="animate"
					exit="exit"
					transition={ {
						type: 'tween',
						duration: disableMotion ? 0 : ANIMATION_DURATION,
						ease: [ 0.33, 0, 0, 1 ],
					} }
					style={ {
						width: '100%',
						gridColumn: '1',
						gridRow: '1',
					} }
				>
					<HStack
						spacing={ 2 }
						className="boot-navigation-screen__title-icon"
					>
						{ ! isRoot && (
							<Button
								ref={ backButtonRef }
								icon={ icon }
								onClick={ handleBackClick }
								label={ __( 'Back' ) }
								size="small"
								variant="tertiary"
							/>
						) }
						<Heading
							className="boot-navigation-screen__title"
							level={ 1 }
							size="15px"
						>
							{ title }
						</Heading>
						{ actions && (
							<div className="boot-navigation-screen__actions">
								{ actions }
							</div>
						) }
					</HStack>

					{ description && (
						<div className="boot-navigation-screen__description">
							{ description }
						</div>
					) }

					{ content }
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
