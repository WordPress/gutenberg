/**
 * WordPress dependencies
 */
import { forwardRef, useState, Fragment } from '@wordpress/element';
import {
	Button,
	CheckboxControl,
	VisuallyHidden,
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
} from '@wordpress/components';
import { useReducedMotion, useInstanceId } from '@wordpress/compose';
import { __, _x, isRTL } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { chevronLeftSmall, chevronRightSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useLinkControlV2Context } from '../context';
import type { LinkSetting, LinkValue } from '../types';

const PREFERENCE_SCOPE = 'core/block-editor';
const PREFERENCE_KEY = 'linkControlSettingsDrawer';

/**
 * Settings subcomponent for LinkControlV2.
 *
 * Collapsible drawer for link settings with preference persistence.
 * Only renders if settings are provided and not empty.
 */
export const Settings = forwardRef< HTMLDivElement >(
	function Settings( props, ref ) {
		const {
			uncommittedValue,
			setUncommittedValue,
			settings,
		} = useLinkControlV2Context();

		const [ localSettingsOpen, setLocalSettingsOpen ] = useState( false );

		// Try to get preference, fallback to local state
		const { advancedSettingsPreference } = useSelect(
			( select ) => {
				const prefsStore = select( preferencesStore );
				return {
					advancedSettingsPreference:
						prefsStore?.get( PREFERENCE_SCOPE, PREFERENCE_KEY ) ?? false,
				};
			},
			[]
		);

		const { set: setPreference } = useDispatch( preferencesStore );

		/**
		 * Sets the open/closed state of the Advanced Settings Drawer,
		 * optionally persisting the state to the user's preferences.
		 *
		 * Note that Block Editor components can be consumed by non-WordPress
		 * environments which may not have preferences setup.
		 * Therefore a local state is also used as a fallback.
		 *
		 * @param {boolean} prefVal The open/closed state of the Advanced Settings Drawer.
		 */
		const setSettingsOpenWithPreference = ( prefVal: boolean ) => {
			if ( setPreference ) {
				setPreference( PREFERENCE_SCOPE, PREFERENCE_KEY, prefVal );
			}
			setLocalSettingsOpen( prefVal );
		};

		// Block Editor components can be consumed by non-WordPress environments
		// which may not have these preferences setup.
		// Therefore a local state is used as a fallback.
		const isSettingsOpen =
			advancedSettingsPreference ?? localSettingsOpen;

		const prefersReducedMotion = useReducedMotion();
		const MaybeAnimatePresence = prefersReducedMotion
			? Fragment
			: AnimatePresence;
		const MaybeMotionDiv = prefersReducedMotion ? 'div' : motion.div;

		const id = useInstanceId( Settings );
		const settingsDrawerId = `link-control-v2-settings-drawer-${ id }`;

		// Don't render if no settings
		if ( ! settings || ! settings.length ) {
			return null;
		}

		// Don't render if there's no URL value
		const hasURL = !! uncommittedValue?.url?.trim()?.length;
		if ( ! hasURL ) {
			return null;
		}

		const handleSettingChange = ( setting: LinkSetting ) => (
			newValue: boolean
		) => {
			setUncommittedValue( {
				...uncommittedValue,
				[ setting.id ]: newValue,
			} );
		};

		const theSettings = settings
			.map( ( setting ) => {
				// If render property is provided
				if ( 'render' in setting && setting.render ) {
					// If it's a valid function, use it
					if ( typeof setting.render === 'function' ) {
						const renderedContent = setting.render(
							setting,
							uncommittedValue,
							( newValue: LinkValue ) => {
								setUncommittedValue( newValue );
							}
						);
						return (
							<div
								key={ setting.id }
								className="block-editor-link-control-v2__setting"
							>
								{ renderedContent }
							</div>
						);
					}
					// If render is provided but invalid, return null
					return null;
				}

				// If render property is not provided, use CheckboxControl
				return (
					<CheckboxControl
						__nextHasNoMarginBottom
						className="block-editor-link-control-v2__setting"
						key={ setting.id }
						label={ setting.title }
						onChange={ handleSettingChange( setting ) }
						checked={
							uncommittedValue ? !! uncommittedValue[ setting.id ] : false
						}
						help={ setting?.help }
					/>
				);
			} )
			.filter( Boolean ); // Remove null entries

		return (
			<div
				ref={ ref }
				className="block-editor-link-control-v2__settings"
				{ ...props }
			>
				<div className="block-editor-link-control-v2__tools">
					<Button
						__next40pxDefaultSize
						className="block-editor-link-control-v2__drawer-toggle"
						aria-expanded={ isSettingsOpen }
						onClick={ () =>
							setSettingsOpenWithPreference( ! isSettingsOpen )
						}
						icon={ isRTL() ? chevronLeftSmall : chevronRightSmall }
						aria-controls={ settingsDrawerId }
					>
						{ _x( 'Advanced', 'Additional link settings' ) }
					</Button>
					<MaybeAnimatePresence>
						{ isSettingsOpen && (
							<MaybeMotionDiv
								className="block-editor-link-control-v2__drawer"
								hidden={ ! isSettingsOpen }
								id={ settingsDrawerId }
								initial="collapsed"
								animate="open"
								exit="collapsed"
								variants={
									prefersReducedMotion
										? undefined
										: {
												open: { opacity: 1, height: 'auto' },
												collapsed: { opacity: 0, height: 0 },
										  }
								}
								transition={
									prefersReducedMotion
										? undefined
										: {
												duration: 0.1,
										  }
								}
							>
								<div className="block-editor-link-control-v2__drawer-inner">
									<fieldset className="block-editor-link-control-v2__settings-fieldset">
										<VisuallyHidden as="legend">
											{ __( 'Currently selected link settings' ) }
										</VisuallyHidden>
										{ theSettings }
									</fieldset>
								</div>
							</MaybeMotionDiv>
						) }
					</MaybeAnimatePresence>
				</div>
			</div>
		);
	}
);

Settings.displayName = 'LinkControlV2.Settings';

