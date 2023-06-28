/*
 * Copyright Truesense AI Solutions Pvt Ltd, All Rights Reserved.
 */

import { Position } from '../position';
import { PrivateAction } from '../private-action';
import { ScenarioEntity } from '../tv-entities';
import { ActionType } from '../tv-enums';

export class TeleportAction extends PrivateAction {

	public label: string = 'Position';
	public actionType: ActionType = ActionType.Private_Position;

	public position: Position;

	constructor ( position: Position ) {

		super();

		this.position = position;

	}

	setPosition ( position: Position ): any {

		this.position = position;

	}

	execute ( entity: ScenarioEntity ) {

		entity.setPosition( this.position.toVector3() );
		entity.setEuler( this.position.toEuler() );

	}
}