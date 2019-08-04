// This file is the entry-point for the  client-side library
declare var window: Window;

import { Scene } from './Scene';
import { SceneDisplay } from './Display';

// Make the Scene and SceneDisplay classes global variables
window['Scene'] =  Scene;
window['SceneDisplay'] =  SceneDisplay;