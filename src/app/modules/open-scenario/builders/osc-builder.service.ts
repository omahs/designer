/*
 * Copyright Truesense AI Solutions Pvt Ltd, All Rights Reserved.
 */

import { Injectable } from '@angular/core';
import { Debug } from 'app/core/utils/debug';
import { ThreeService } from 'app/modules/three-js/three.service';
import { IFile } from '../../../core/models/file';
import { AppService } from '../../../core/services/app.service';
import { OpenDriveApiService } from '../../../core/services/open-drive-api.service';
import { FileService } from '../../../services/file.service';
import { TvMapService } from '../../tv-map/services/tv-map.service';
import { OscCatalogReference } from '../models/osc-catalogs';
import { OscEntityObject } from '../models/osc-entities';
import { AbstractPrivateAction } from '../models/osc-interfaces';
import { OscMiscObject } from '../models/osc-misc-object';
import { OscPedestrian } from '../models/osc-pedestrian';
import { OscRoadNetwork } from '../models/osc-road-network';
import { OpenScenario } from '../models/osc-scenario';
import { OscStoryboard } from '../models/osc-storyboard';
import { OscVehicle } from '../models/osc-vehicle';
import { ActionService } from './action-service';
import { OscEntityBuilder } from './osc-entity-builder';

@Injectable( {
	providedIn: 'root'
} )
export class OscBuilderService {

	private scenario: OpenScenario;
	private currentFile: IFile;

	constructor (
		private openDriveService: TvMapService,
		private fileService: FileService,
		private threeService: ThreeService,
		private openDriveApi: OpenDriveApiService
	) {
	}

	public static buildVehicleEntity ( obj: OscEntityObject, executeAction = true ) {

		// var geometry = new THREE.BoxGeometry( 1, 1, 1 );
		// var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
		// obj.gameObject = new THREE.Mesh( geometry, material );

		OscEntityBuilder.build( obj, executeAction );

	}

	// addVehicleActor ( point: THREE.Vector3 ): any {

	//   const playerName = 'New Player';

	//   const car = this.createCar( point );

	//   const oscEntityObject = new OscEntityObject( playerName );

	//   this.openScenario.addEntity( oscEntityObject );

	//   const positionAction = new OscPositionAction();

	//   positionAction.setPosition( OscWorldPosition.createFromVector3( car.position ) );

	//   const speedAction = new OscSpeedAction();

	//   speedAction.setAbsoluteTarget( 0 );

	//   oscEntityObject.speedAction = speedAction;

	//   this.openScenario.storyboard.addPrivateInitAction( playerName, positionAction );
	//   this.openScenario.storyboard.addPrivateInitAction( playerName, speedAction );

	//   ThreeJsUtils.addComponent( car, new ComponentItem( OscPlayerPropertiesComponent, oscEntityObject ) );

	// }


	// createCar ( point: THREE.Vector3 ): THREE.Object3D {

	//   const spriteMap = new THREE.TextureLoader().load( 'assets/img/top-view-car-red.png' );
	//   const geometry = new THREE.PlaneBufferGeometry( 6, 3 );
	//   geometry.rotateX( -Math.PI / 2 );
	//   const material = new THREE.MeshBasicMaterial( { map: spriteMap, transparent: true, opacity: 0.9 } );
	//   const car = new THREE.Mesh( geometry, material );
	//   car.userData.clickable = false;
	//   SceneService.addClickableObject( car );

	//   car.position.set( point.x, 0.1, point.z );

	//   return car;

	// }


	public static executePrivateAction ( obj: OscEntityObject, privateAction: AbstractPrivateAction ) {

		ActionService.executePrivateAction( obj, privateAction );

	}


	build ( scenario: OpenScenario, file: IFile ) {

		this.scenario = scenario;
		this.currentFile = file;

		this.buildRoadNetwork( this.scenario.roadNetwork, () => {

			this.buildEntities();

			this.buildInitActions( this.scenario.storyboard );

		} );
	}

	private buildEntities () {

		this.scenario.objects.forEach( ( obj: OscEntityObject, index ) => {

			// const type = obj.m_Object.constructor.name;
			const type = OscCatalogReference.name;

			// TODO: Replace this with enums
			switch ( type ) {

				case OscCatalogReference.name:
					this.buildCatalogEntity( obj );
					break;

				case OscVehicle.name:
					Debug.log( 'type vehicle' );
					break;

				case OscPedestrian.name:
					Debug.log( 'type pedestrian' );
					break;

				case OscMiscObject.name:
					Debug.log( 'type misc-object' );
					break;

			}

		} );

	}

	private buildCatalogEntity ( obj: OscEntityObject ) {

		Debug.log( 'type catalogue' );

		OscBuilderService.buildVehicleEntity( obj );

	}

	private buildRoadNetwork ( roadNetwork: OscRoadNetwork, callbackFn: any ) {

		// TODO: SceneAsset
		// TODO: Signals

		if ( AppService.isElectronApp ) {

			if ( roadNetwork == null || roadNetwork.logics == null || roadNetwork.logics.filepath == null ) {
				throw new Error( 'road network empty' );
			}

			let openDriveFilename = roadNetwork.logics.filepath;

			if ( this.currentFile.online ) {

				this.fetchFromServer( openDriveFilename, callbackFn );

			} else {

				let finalPath = this.fileService.resolve( this.currentFile.path, openDriveFilename );

				this.openDriveService.importFromPath( finalPath, callbackFn );
			}

		} else {

			callbackFn();

		}
	}

	private buildInitActions ( storyboard: OscStoryboard ) {

		Debug.log( storyboard );

		// storyboard.InitActions.PrivateActions.forEach( ( action: AbstractAction, i ) => {
		//
		//   // action.execute();
		//
		// } );

	}

	private fetchFromServer ( openDriveFilename: string, callbackFn: Function ) {

		this.openDriveApi.getOpenDrive( openDriveFilename ).subscribe( file => {

			this.openDriveService.import( file, callbackFn );

		} );

	}
}