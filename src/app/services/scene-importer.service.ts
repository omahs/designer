/*
 * Copyright Truesense AI Solutions Pvt Ltd, All Rights Reserved.
 */

import { Injectable } from '@angular/core';
import { RoadFactory } from 'app/core/factories/road-factory.service';
import { AppInspector } from 'app/core/inspector';
import { IFile } from 'app/core/io/file';
import { PropInstance } from 'app/core/models/prop-instance.model';
import { AbstractReader } from 'app/core/services/abstract-reader';
import { SceneService } from 'app/core/services/scene.service';
import { AbstractSpline } from 'app/core/shapes/abstract-spline';
import { AutoSpline } from 'app/core/shapes/auto-spline';
import { CatmullRomSpline } from 'app/core/shapes/catmull-rom-spline';
import { ExplicitSpline } from 'app/core/shapes/explicit-spline';
import { ToolManager } from 'app/core/tools/tool-manager';
import { DynamicControlPoint } from 'app/modules/three-js/objects/dynamic-control-point';
import { RoadControlPoint } from 'app/modules/three-js/objects/road-control-point';
import { TvMapBuilder } from 'app/modules/tv-map/builders/tv-map-builder';
import { PropCurve } from 'app/modules/tv-map/models/prop-curve';
import { PropPolygon } from 'app/modules/tv-map/models/prop-polygons';
import { TvMap } from 'app/modules/tv-map/models/tv-map.model';
import { TvRoad } from 'app/modules/tv-map/models/tv-road.model';
import { TvSurface } from 'app/modules/tv-map/models/tv-surface.model';
import { OpenDriverParser, XmlElement } from 'app/modules/tv-map/services/open-drive-parser.service';
import { TvMapInstance } from 'app/modules/tv-map/services/tv-map-source-file';
import { TvMapService } from 'app/modules/tv-map/services/tv-map.service';
import { XMLParser } from 'fast-xml-parser';
import { Euler, Object3D, Vector2, Vector3 } from 'three';
import { AssetDatabase } from '../core/asset/asset-database';
import { AssetLoaderService } from '../core/asset/asset-loader.service';
import { FileService } from '../core/io/file.service';
import { TvConsole } from '../core/utils/console';
import { CommandHistory } from './command-history';
import { ModelImporterService } from './model-importer.service';
import { SnackBar } from './snack-bar.service';
import { TvElectronService } from './tv-electron.service';


@Injectable( {
	providedIn: 'root'
} )
export class SceneImporterService extends AbstractReader {

	constructor (
		private fileService: FileService,
		private openDriveService: TvMapService,
		private assets: AssetLoaderService,
		private odParser: OpenDriverParser,
		private modelImporter: ModelImporterService,
		private electronService: TvElectronService,
	) {
		super();
	}

	get map (): TvMap {
		return TvMapInstance.map;
	}

	set map ( value ) {
		TvMapInstance.map = value;
	}

	importFromPath ( path: string ) {

		try {

			this.fileService.readFile( path, 'scene', ( file ) => {

				this.importFromFile( file );

			} );

		} catch ( error ) {

			SnackBar.error( error );

		}

	}

	importFromFile ( file: IFile ): void {

		try {

			if ( this.importFromString( file.contents ) ) {

				TvMapInstance.currentFile = file;

				this.electronService.setTitle( file.name, file.path );

			}

		} catch ( error ) {

			SnackBar.error( error );

			console.error( error, file );

		}

	}


	importFromString ( contents: string ): boolean {

		const defaultOptions = {
			attributeNamePrefix: 'attr_',
			attrNodeName: false,
			textNodeName: 'value',
			ignoreAttributes: false,
			supressEmptyNode: false,
			format: true,
			allowBooleanAttributes: true
		};

		const parser = new XMLParser( defaultOptions );

		const scene: any = parser.parse( contents );

		// check for main elements first before parsing
		const version = scene.version;
		const guid = scene.guid;

		if ( !version ) SnackBar.error( 'Cannot read scene version. Please check scene file before importing', 'OK', 5000 );
		if ( !version ) console.error( 'Cannot read scene version', scene );
		if ( !version ) return;

		this.prepareToImport();

		this.importScene( scene );

		return true;
	}

	private prepareToImport () {

		ToolManager.clear();

		AppInspector.clear();

		CommandHistory.clear();

		this.map.destroy();

		this.map = this.odParser.map = new TvMap();

	}

	private importScene ( xml: XmlElement ): void {

		this.readAsOptionalArray( xml.road, xml => {

			this.map.addRoad( this.importRoad( xml ) );

		} );

		this.map.roads.forEach( road => {

			if ( road.isJunction ) {

				road.spline.controlPoints.forEach( ( cp: RoadControlPoint ) => cp.allowChange = false );

			}

			// if ( road.successor && road.successor.elementType === "road" ) {

			//     const successor = this.openDrive.getRoadById( road.successor.elementId );

			//     successor.updated.subscribe( i => road.onSuccessorUpdated( i ) );
			// }

			// if ( road.predecessor && road.predecessor.elementType === "road" ) {

			//     const predecessor = this.openDrive.getRoadById( road.predecessor.elementId );

			//     predecessor.updated.subscribe( i => road.onPredecessorUpdated( i ) );
			// }

		} );

		this.readAsOptionalArray( xml.prop, xml => {

			this.importProp( xml );

		} );

		this.readAsOptionalArray( xml.propCurve, xml => {

			this.map.propCurves.push( this.importPropCurve( xml ) );

		} );

		this.readAsOptionalArray( xml.propPolygon, xml => {

			this.map.propPolygons.push( this.importPropPolygon( xml ) );

		} );

		this.readAsOptionalArray( xml.surface, xml => {

			this.map.surfaces.push( this.importSurface( xml ) );

		} );

		this.readAsOptionalArray( xml.junction, xml => {

			const junction = this.odParser.parseJunction( xml );

			if ( xml.position ) {

				junction.position = new Vector3(
					parseFloat( xml.position.attr_x ),
					parseFloat( xml.position.attr_y ),
					parseFloat( xml.position.attr_z ),
				);
			}

			this.map.addJunctionInstance( junction );

		} );


		this.map.roads.forEach( road => {

			TvMapBuilder.buildRoad( this.map.gameObject, road );

		} );

		SceneService.add( this.map.gameObject );

	}

	private importProp ( xml ) {

		const propObject = this.preparePropObject( xml );

		this.map.gameObject.add( propObject );

		this.map.props.push( new PropInstance( xml.attr_guid, propObject ) );

	}

	private importRoad ( xml: XmlElement ): TvRoad {

		if ( !xml.spline ) throw new Error( 'Incorrect road' );

		const name = xml.attr_name || 'untitled';
		const length = parseFloat( xml.attr_length );
		const id = parseInt( xml.attr_id );
		const junction = parseInt( xml.attr_junction ) || -1;

		const road = RoadFactory.getNewRoad( name, length, id, junction );

		road.drivingMaterialGuid = xml.drivingMaterialGuid;
		road.sidewalkMaterialGuid = xml.sidewalkMaterialGuid;
		road.borderMaterialGuid = xml.borderMaterialGuid;
		road.shoulderMaterialGuid = xml.shoulderMaterialGuid;

		road.spline = this.importSpline( xml.spline, road );

		this.odParser.parseRoadTypes( road, xml );

		if ( xml.link != null ) this.odParser.parseRoadLinks( road, xml.link );

		if ( xml.elevationProfile != null ) this.odParser.parseElevationProfile( road, xml.elevationProfile );

		if ( xml.lateralProfile != null ) this.odParser.parseLateralProfile( road, xml.lateralProfile );

		if ( xml.lanes != null ) this.odParser.parseLanes( road, xml.lanes );

		// if ( xml.objects != null && xml.objects !== '' ) this.readObjects( road, xml.objects );

		// if ( xml.signals != null && xml.signals !== '' ) this.readSignals( road, xml.signals );

		// if ( xml.surface != null && xml.surface !== '' ) this.readSurface( road, xml.surface );

		return road;
	}

	private importSurface ( xml: XmlElement ): TvSurface {

		const height = parseFloat( xml.attr_height ) || 0.0;

		const rotation = parseFloat( xml.attr_rotation ) || 0.0;

		const material = xml.material.attr_guid || 'grass';

		const offset = new Vector2(
			parseFloat( xml.offset.attr_x ),
			parseFloat( xml.offset.attr_y ),
		);

		const scale = new Vector2(
			parseFloat( xml.scale.attr_x ),
			parseFloat( xml.scale.attr_y ),
		);

		const spline = this.importCatmullSpline( xml.spline );

		const surface = new TvSurface( material, spline, offset, scale, rotation, height );

		spline.controlPoints.forEach( p => p.mainObject = surface );

		return surface;
	}

	private importSpline ( xml: XmlElement, road: TvRoad ): AbstractSpline {

		const type = xml.attr_type;

		if ( type === 'auto' ) {

			const spline = this.importAutoSpline( xml, road );

			road.updateGeometryFromSpline();

			return spline;

		} else if ( type === 'explicit' ) {

			const spline = road.spline = this.importExplicitSpline( xml, road );

			road.updateGeometryFromSpline( true );

			return spline;

		} else {

			throw new Error( 'unknown spline type' );

		}

	}

	private importExplicitSpline ( xml: XmlElement, road: TvRoad ): ExplicitSpline {

		const spline = road.spline = new ExplicitSpline( road );

		let index = 0;

		this.readAsOptionalArray( xml.point, xml => {

			const position = new Vector3(
				parseFloat( xml.attr_x ),
				parseFloat( xml.attr_y ),
				parseFloat( xml.attr_z ),
			);

			const hdg = parseFloat( xml.attr_hdg );

			const segType = +xml.attr_type;

			spline.addFromFile( index, position, hdg, segType );

			index++;

		} );

		// to not show any lines or control points
		spline.hide();

		return spline;
	}

	private importAutoSpline ( xml, road: TvRoad ): AutoSpline {

		const spline = road.spline as AutoSpline;

		this.readAsOptionalArray( xml.point, xml => {

			const position = this.importVector3( xml );

			SceneService.add( spline.addControlPointAt( position ) );

		} );

		// to not show any lines or control points
		spline.hide();

		return spline;
	}

	private importCatmullSpline ( xml: XmlElement, mainObject?: any ): CatmullRomSpline {

		const type = xml.attr_type || 'catmullrom';
		const closed = xml.attr_closed === 'true';
		const tension = parseFloat( xml.attr_tension ) || 0.5;

		const spline = new CatmullRomSpline( closed, type, tension );

		this.readAsOptionalArray( xml.point, xml => {

			const position = this.importVector3( xml );

			const controlPoint = new DynamicControlPoint( mainObject, position );

			spline.addControlPoint( controlPoint );

			SceneService.add( controlPoint );

		} );

		// to make the line and other calculations
		spline.update();

		// to not show any lines or control points
		spline.hide();

		return spline;
	}

	private importOpenDrive ( road: any ) {

		// guid
		if ( typeof road === 'string' ) {

			try {

				const meta = this.assets.find( road );

				this.openDriveService.importFromPath( meta.guid );

			} catch ( error ) {

				SnackBar.error( error );

			}

		}

		if ( typeof road === 'object' ) {

		}
	}

	private importProps ( props: any ): any[] {

		const instances: any[] = [];

		if ( Array.isArray( props ) ) {

			props.forEach( ( prop: XmlElement ) => {

				instances.push( {
					guid: prop.guid,
					position: prop.position,
					rotation: prop.rotation,
					scale: prop.scale
				} );

			} );

		}

		return instances;
	}

	private importVector3 ( xml: XmlElement ): Vector3 {

		return new Vector3(
			parseFloat( xml.attr_x ),
			parseFloat( xml.attr_y ),
			parseFloat( xml.attr_z ),
		);

	}

	private importPropCurve ( xml: XmlElement ): PropCurve {

		const guid = xml.attr_guid;

		const meta = AssetDatabase.getMetadata( guid );

		if ( !meta ) return;

		const spline = this.importCatmullSpline( xml.spline );

		const curve = new PropCurve( guid, spline );

		spline.controlPoints.forEach( p => p.mainObject = curve );

		curve.reverse = xml.attr_reverse === 'true' ? true : false;

		curve.rotation = parseFloat( xml.attr_rotation ) || 0;

		curve.positionVariance = parseFloat( xml.attr_positionVariance ) || 0;

		this.readAsOptionalArray( xml.props, propXml => {

			const instance = AssetDatabase.getInstance( propXml.attr_guid ) as Object3D;

			const prop = instance.clone();

			const position = this.importVector3( propXml?.position );

			const rotation = this.importVector3( propXml?.rotation );

			const scale = this.importVector3( propXml?.scale );

			curve.addProp( prop, position, rotation, scale );

		} );

		return curve;
	}

	private importPropPolygon ( xml: XmlElement ): PropPolygon {

		const guid = xml.attr_guid;

		const density = parseFloat( xml.attr_density ) || 0.5;

		const metadata = AssetDatabase.getMetadata( guid );

		if ( !metadata ) return;

		const spline = this.importCatmullSpline( xml.spline );

		const polygon = new PropPolygon( guid, spline, density );

		spline.controlPoints.forEach( p => p.mainObject = p.userData.polygon = polygon );

		this.readAsOptionalArray( xml.props, propXml => {

			const propObject = this.preparePropObject( propXml );

			polygon.addPropObject( propObject );

			SceneService.add( propObject );

		} );

		SceneService.add( polygon.mesh );

		return polygon;
	}

	private preparePropObject ( xml: XmlElement ): Object3D {

		const instance = AssetDatabase.getInstance<Object3D>( xml.attr_guid );

		if ( !instance ) TvConsole.error( `Object not found` );

		if ( !instance ) return;

		const prop = instance.clone();

		const position = new Vector3(
			parseFloat( xml.position.attr_x ),
			parseFloat( xml.position.attr_y ),
			parseFloat( xml.position.attr_z ),
		);

		const rotation = new Euler(
			parseFloat( xml.rotation.attr_x ),
			parseFloat( xml.rotation.attr_y ),
			parseFloat( xml.rotation.attr_z ),
		);

		const scale = new Vector3(
			parseFloat( xml.scale.attr_x ),
			parseFloat( xml.scale.attr_y ),
			parseFloat( xml.scale.attr_z ),
		);

		prop.position.copy( position );

		prop.rotation.copy( rotation );

		prop.scale.copy( scale );

		return prop;
	}
}
