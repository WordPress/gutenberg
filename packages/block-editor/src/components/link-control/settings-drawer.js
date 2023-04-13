/**
 * WordPress dependencies
 */
import {
	Button,
	TextControl,
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
} from '@wordpress/components';
import { settings as settingsIcon } from '@wordpress/icons';
import { useReducedMotion, useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Settings from './settings';

function LinkSettingsDrawer( {
	settingsOpen,
	setSettingsOpen,
	showTextControl,
	showSettings,
	textInputRef,
	internalTextInputValue,
	setInternalTextInputValue,
	handleSubmitWithEnter,
	value,
	settings,
	onChange,
} ) {
	const prefersReducedMotion = useReducedMotion();
	const MaybeAnimatePresence = prefersReducedMotion
		? Fragment
		: AnimatePresence;
	const MaybeMotionDiv = prefersReducedMotion ? 'div' : motion.div;

	const id = useInstanceId( LinkSettingsDrawer );

	const settingsDrawerId = `link-control-settings-drawer-${ id }`;

	return (
		<>
			<Button
				className="block-editor-link-control__drawer-toggle"
				aria-expanded={ settingsOpen }
				onClick={ () => setSettingsOpen( ! settingsOpen ) }
				icon={ settingsIcon }
				label={ __( 'Link Settings' ) }
				aria-controls={ settingsDrawerId }
			/>
			<MaybeAnimatePresence>
				{ settingsOpen && (
					<MaybeMotionDiv
						className="block-editor-link-control__drawer"
						hidden={ ! settingsOpen }
						id={ settingsDrawerId }
						initial="collapsed"
						animate="open"
						exit="collapsed"
						variants={ {
							open: { opacity: 1, height: 'auto' },
							collapsed: { opacity: 0, height: 0 },
						} }
						transition={ {
							duration: 0.1,
						} }
					>
						<div className="block-editor-link-control__drawer-inner">
							{ showTextControl && (
								<TextControl
									__nextHasNoMarginBottom
									ref={ textInputRef }
									className="block-editor-link-control__setting block-editor-link-control__text-content"
									label="Text"
									value={ internalTextInputValue }
									onChange={ setInternalTextInputValue }
									onKeyDown={ handleSubmitWithEnter }
								/>
							) }
							{ showSettings && (
								<Settings
									value={ value }
									settings={ settings }
									onChange={ onChange }
								/>
							) }
						</div>
					</MaybeMotionDiv>
				) }
			</MaybeAnimatePresence>
		</>
	);
}

export default LinkSettingsDrawer;
