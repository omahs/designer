/*
 * Copyright Truesense AI Solutions Pvt Ltd, All Rights Reserved.
 */

import { TvLane } from '../../modules/tv-map/models/tv-lane';
import { TvLaneSection } from '../../modules/tv-map/models/tv-lane-section';
import { BaseCommand } from './base-command';

export class RemoveLaneCommand extends BaseCommand {

	private laneSection: TvLaneSection;

	constructor ( private lane: TvLane ) {

		super();

		this.laneSection = this.lane.laneSection;

	}

	execute (): void {

		this.laneSection.removeLaneById( this.lane.id );

		this.buildRoad( this.laneSection.road );

	}

	undo (): void {

		this.laneSection.addLaneInstance( this.lane, true );

		this.buildRoad( this.laneSection.road );

	}

	redo (): void {

		this.laneSection.removeLaneById( this.lane.id );

		this.buildRoad( this.laneSection.road );

	}

}
