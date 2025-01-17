/*
 * Copyright Truesense AI Solutions Pvt Ltd, All Rights Reserved.
 */

import { BaseCommand } from 'app/core/commands/base-command';
import { SelectPointCommand } from 'app/core/commands/select-point-command';
import { SceneService } from 'app/core/services/scene.service';
import { DynamicControlPoint } from 'app/modules/three-js/objects/dynamic-control-point';
import { PropPolygon } from 'app/modules/tv-map/models/prop-polygons';
import { DynamicInspectorComponent } from 'app/views/inspectors/dynamic-inspector/dynamic-inspector.component';
import { Vector3 } from 'three';
import { PropPolygonTool } from './prop-polygon-tool';

export class AddPropPolygonPointCommand extends BaseCommand {

	private newPoint: DynamicControlPoint<PropPolygon>;
	private selectCommand: SelectPointCommand;

	constructor ( private tool: PropPolygonTool, private polygon: PropPolygon, private position: Vector3 ) {

		super();

		this.newPoint = new DynamicControlPoint( polygon, position );

		this.selectCommand = new SelectPointCommand( this.tool, this.newPoint, DynamicInspectorComponent, this.polygon );

	}

	execute (): void {

		this.polygon.addControlPoint( this.newPoint );

		this.polygon.showControlPoints();
		this.polygon.showCurve();

		this.selectCommand.execute();

		SceneService.add( this.newPoint );

	}

	undo (): void {

		this.polygon.removeControlPoint( this.newPoint );

		this.polygon.showControlPoints();

		if ( this.polygon.spline.controlPoints.length < 2 ) {
			this.polygon.spline?.hideLines();
		}

		this.selectCommand.undo();

		SceneService.remove( this.newPoint );

	}

	redo (): void {

		this.execute();

	}

}
