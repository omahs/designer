/*
 * Copyright Truesense AI Solutions Pvt Ltd, All Rights Reserved.
 */

import { TvScenarioInstance } from '../services/tv-scenario-instance';
import { CatalogReference } from './tv-catalogs';
import { Maneuver } from './tv-maneuver';

/**
 * Using ManeuverGroup we specify the Actors that are executing the actions.
 * Because we want Vehicle 1 to change lanes, we specify its name under Actors.
 * This means that all the actions under this ManeuverGroup are executed by Vehicle 1.
 */
export class Sequence {

	private static count = 1;

	// public name: string;
	// public numberOfExecutions: number;
	// public actors: string[] = [];

	// TODO: ByConditionActor

	public catalogReferences: CatalogReference[] = [];
	public maneuvers: Maneuver[] = [];

	constructor ( public name?: string, public numberOfExecutions?: number, public actors?: string[] ) {

		if ( this.actors == null ) this.actors = [];

		Sequence.count++;

	}

	static getNewName ( name = 'MySequence' ) {

		return `${ name }${ this.count }`;

	}

	addNewManeuver ( name: string ) {

		const maneuver = new Maneuver( name );

		this.addManeuver( maneuver );

		return maneuver;

	}

	addManeuver ( maneuver: Maneuver ) {

		const hasName = TvScenarioInstance.db.has_maneuver( maneuver.name );

		if ( hasName ) throw new Error( 'Maneuver name already used' );

		this.maneuvers.push( maneuver );

		TvScenarioInstance.db.add_maneuver( maneuver.name );

	}
}
