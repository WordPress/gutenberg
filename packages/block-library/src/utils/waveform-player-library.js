/**
 * The only module that may import the waveform player: importing it anywhere
 * else initializes every `[data-waveform-player]` element on the page, which
 * includes markup the Playlist block does not own.
 */

import { restoreWaveformAutoInit } from './disable-waveform-autoinit';
/* eslint-disable-next-line import/order, no-restricted-imports -- The opt-out above has to be applied before this module is evaluated. */
import WaveformPlayerLib from '@arraypress/waveform-player';

restoreWaveformAutoInit();

export default WaveformPlayerLib;
