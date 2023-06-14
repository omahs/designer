import { Vector3 } from 'three';
import { PositionType } from './tv-enums';

export abstract class AbstractPosition {

	abstract readonly type: PositionType;
	public vector3: THREE.Vector3 = new Vector3( 0, 0, 0 );

	abstract toVector3 (): Vector3;

	setPosition ( point: Vector3 ) {
		throw new Error( 'Method not implemented.' );
	}

}
