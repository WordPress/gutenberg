import {
	headingLevel1,
	headingLevel2,
	headingLevel3,
	headingLevel4,
	headingLevel5,
	headingLevel6,
	paragraph,
} from '@wordpress/icons';
import { Icon as WCIcon } from '@wordpress/components';
import type { ReactElement } from 'react';
import type { HeadingLevelIconProps } from './types';

const LEVEL_TO_PATH: Record< number, ReactElement > = {
	0: paragraph,
	1: headingLevel1,
	2: headingLevel2,
	3: headingLevel3,
	4: headingLevel4,
	5: headingLevel5,
	6: headingLevel6,
};

/**
 * Heading level icon.
 *
 * @param props       Component props.
 * @param props.level The heading level to show an icon for.
 *
 * @return The icon.
 */
export default function HeadingLevelIcon( { level }: HeadingLevelIconProps ) {
	// An unset level matches no icon.
	if ( LEVEL_TO_PATH[ level as number ] ) {
		return <WCIcon icon={ LEVEL_TO_PATH[ level as number ] } />;
	}

	return null;
}
