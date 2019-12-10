/**
 * An interface representing the manifest of nwjs.
 *
 * See Manifest Format for more details.
 * http://docs.nwjs.io/en/latest/References/Manifest%20Format/
 */
export interface NwjsManifest {
  name: string;
  main: string;
  window: NwjsManifestWindow;
  webkit: NwjsManifestWebkit;
}

/**
 * http://docs.nwjs.io/en/latest/References/Manifest%20Format/#window-subfields
 */
export interface NwjsManifestWindow {
  title: string;
  icon: string;
  toolbar: boolean;
  frame: boolean;
  position: NwjsManifestPosition;
  resizable: boolean;
  width: number;
  height: number;
  max_width: number;
  max_height: number;
  min_width: number;
  min_height: number;
}

/**
 * http://docs.nwjs.io/en/latest/References/Manifest%20Format/#webkit-subfields
 */
export interface NwjsManifestWebkit {
  plugin: boolean;
}

/**
 * http://docs.nwjs.io/en/latest/References/Manifest%20Format/#position
 */
export enum NwjsManifestPosition {
  mouse = "mouse",
  center = "center"
}
