/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { TabPanel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DefaultSidebar from './default-sidebar';
import BlockPanel from './block-panel';
import GlobalPanel from './global-panel';
import { useGlobalStylesContext } from '../editor/global-styles-provider';
import { GLOBAL_CONTEXT } from '../editor/utils';

export default ( { identifier, title: panelTitle, icon } ) => {
	const { contexts, getProperty, setProperty } = useGlobalStylesContext();

	if ( typeof contexts !== 'object' || ! contexts?.[ GLOBAL_CONTEXT ] ) {
		// No sidebar is shown.
		return null;
	}

	return (
		<DefaultSidebar
			identifier={ identifier }
			title={ panelTitle }
			icon={ icon }
		>
			<TabPanel
				tabs={ [
					{ name: 'global', title: __( 'Global' ) },
					{ name: 'block', title: __( 'By Block Type' ) },
				] }
			>
				{ ( tab ) => {
					if ( 'block' === tab.name ) {
						return (
							<BlockPanel
								contexts={ omit( contexts, [
									GLOBAL_CONTEXT,
								] ) }
								setProperty={ setProperty }
								getProperty={ getProperty }
							/>
						);
					}
					return (
						<GlobalPanel
							context={ contexts[ GLOBAL_CONTEXT ] }
							setProperty={ setProperty }
							getProperty={ getProperty }
						/>
					);
				} }
			</TabPanel>
		</DefaultSidebar>
	);
};
