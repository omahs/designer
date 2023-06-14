/*
 * Copyright Truesense AI Solutions Pvt Ltd, All Rights Reserved.
 */

import { ActionCategory } from '../tv-enums';
import { AbstractAction } from '../tv-interfaces';

export abstract class GlobalAction extends AbstractAction {

	public category = ActionCategory.global;

}