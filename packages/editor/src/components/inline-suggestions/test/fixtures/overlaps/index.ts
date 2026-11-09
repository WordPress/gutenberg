/**
 * The shared overlap fixtures (plan section 8.1). Vitest, PHPUnit and the
 * end-to-end order runner all read these files.
 */
import type { Fixture } from '../overlap-oracle';
import addInDel from './add-in-del.json';
import annezazu from './annezazu.json';
import annezazuV2 from './annezazu-v2.json';
import annezazuV3 from './annezazu-v3.json';
import formatInAdd from './format-in-add.json';
import fourSameKind from './four-same-kind.json';
import stackedConflict from './stacked-conflict.json';
import straddle from './straddle.json';
import twoDeletions from './two-deletions.json';

export const FIXTURES = [
	annezazu,
	annezazuV2,
	annezazuV3,
	fourSameKind,
	twoDeletions,
	addInDel,
	stackedConflict,
	straddle,
	formatInAdd,
] as Fixture[];
