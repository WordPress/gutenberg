/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import {
	Button,
	SVG,
	Path,
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
} from '@wordpress/components';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useGlobalStyle } = unlock( blockEditorPrivateApis );

const EditOverlay = ( { onClick, label } ) => {
	const [ isVisible, setIsVisible ] = useState( true );
	const [ backgroundColor ] = useGlobalStyle( 'color.background' );

	useEffect( () => {
		const timeout = setTimeout( () => {
			setIsVisible( false );
		}, 4000 );

		return () => clearTimeout( timeout );
	}, [ backgroundColor ] );

	return (
		<AnimatePresence>
			{ isVisible && (
				<motion.div
					initial={ { opacity: 0 } }
					animate={ { opacity: 1 } }
					exit={ { opacity: 0 } }
					onClick={ onClick }
					role="button"
					className="edit-site-layout__edit-overlay"
				>
					<motion.div
						initial={ { opacity: 0, y: 10 } }
						animate={ { opacity: 1, y: 0 } }
						exit={ { opacity: 0, y: 10 } }
					>
						<Button
							className="edit-site-layout__edit-overlay-button"
							onClick={ onClick }
							icon={
								<SVG
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<Path d="m9 9 5 12 1.8-5.2L21 14Z" />
									<Path d="M7.2 2.2 8 5.1" />
									<Path d="m5.1 8-2.9-.8" />
									<Path d="M14 4.1 12 6" />
									<Path d="m6 12-1.9 2" />
								</SVG>
							}
						>
							{ label }
						</Button>
					</motion.div>
					{ /* Your content here */ }
				</motion.div>
			) }
		</AnimatePresence>
	);
};

export default EditOverlay;
