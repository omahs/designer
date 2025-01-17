/*
 * Copyright Truesense AI Solutions Pvt Ltd, All Rights Reserved.
 */

import { OdTextures } from 'app/modules/tv-map/builders/od.textures';
import { COLOR } from 'app/shared/utils/colors.service';
import { BufferAttribute, BufferGeometry, PointsMaterial, Vector3 } from 'three';
import { IHasUpdate } from '../commands/set-value-command';
import { BaseControlPoint } from './control-point';

export class DynamicControlPoint<T extends IHasUpdate> extends BaseControlPoint {

	public mainObject: T;

	constructor ( mainObject: T, position?: Vector3 ) {

		const dotGeometry = new BufferGeometry();

		dotGeometry.setAttribute( 'position', new BufferAttribute( new Float32Array( 3 ), 3 ) );

		const texture = OdTextures.point;

		const dotMaterial = new PointsMaterial( {
			size: 10,
			sizeAttenuation: false,
			map: texture,
			alphaTest: 0.5,
			transparent: true,
			color: COLOR.CYAN,
			depthTest: false
		} );

		super( dotGeometry, dotMaterial );

		this.mainObject = mainObject;

		if ( position ) this.copyPosition( position );

	}

	copyPosition ( position: Vector3 ): void {

		super.copyPosition( position );

	}

	update () {

		this.mainObject?.update();

	}
}
