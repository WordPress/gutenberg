/**
 * Internal dependencies
 */
import development from './config/development';
import plugin from './config/plugin';
import production from './config/production';

import {
	getFeatureFlag as unboundGetFeatureFlag,
} from './utils';

const configMap = {
	development,
	plugin,
	production,
};

const activeConfig = configMap[ process.env.NODE_ENV ] || development;

export const getFeatureFlag = unboundGetFeatureFlag.bind( null, activeConfig );
